import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http/api.service';
import { Business, Category, Product, ProductImage } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { SellerService } from '../../core/services/seller.service';
import { ToastService } from '../../core/services/toast.service';
import { HumanPipe, InrPipe, badgeClass } from '../../shared/format';

interface ProductForm {
  id: number | null;
  businessId: number | null;
  categoryId: number | null;
  name: string;
  description: string;
  price: number | null;
  stockQuantity: number | null;
  unit: string;
  available: boolean;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [FormsModule, InrPipe, HumanPipe],
  template: `
    <div class="container page">
      <div class="page-head"><div><h1>Meri dukaan</h1><p>Apni dukaan aur products yahin se sambhaliye.</p></div></div>

      @if (!isSeller()) {
        <section class="card center" style="padding: 44px 20px; max-width: 620px; margin: 0 auto">
          <div style="font-size: 3rem">🏪</div>
          <h2>Aaspaas par dukaandaar banein</h2>
          <p class="muted" style="margin: 10px 0 20px">Apni dukaan jodein, products daalein aur apne mohalle ke graahakon tak pahunchein.</p>
          @if (roleError()) { <div class="alert alert-error" style="margin-bottom: 14px">{{ roleError() }}</div> }
          <button type="button" class="btn btn-primary btn-lg" [disabled]="busy()" (click)="becomeSeller()">{{ busy() ? 'Ho raha hai...' : 'Seller banein' }}</button>
        </section>
      } @else {
        <section class="card">
          <div class="row-between"><h3 style="margin: 0">Meri dukaanein</h3><button type="button" class="btn btn-primary btn-sm" (click)="showBiz.set(!showBiz())">{{ showBiz() ? 'Band karein' : '+ Nayi dukaan' }}</button></div>

          @if (showBiz()) {
            <form class="mt" (ngSubmit)="saveBusiness()" #bf="ngForm">
              <div class="form-grid">
                <div class="field"><label for="bn">Dukaan ka naam</label><input id="bn" class="input" name="bn" [(ngModel)]="biz.name" required minlength="2" maxlength="150" /></div>
                <div class="field"><label for="bt">Dukaan ka type</label>
                  <select id="bt" class="select" name="bt" [(ngModel)]="biz.businessType" required>
                    <option value="KIRANA">Kirana</option><option value="PHARMACY">Dawai</option><option value="RESTAURANT">Khana / Restaurant</option>
                    <option value="ELECTRONICS">Electronics</option><option value="DAIRY">Dairy</option><option value="VEGETABLES">Sabzi / Fruits</option><option value="OTHER">Kuch aur</option>
                  </select></div>
                <div class="field"><label for="bp">Phone</label><input id="bp" class="input" name="bp" [(ngModel)]="biz.phone" /></div>
              </div>
              <div class="field"><label for="bd">Description</label><textarea id="bd" class="textarea" name="bd" [(ngModel)]="biz.description" maxlength="1000"></textarea></div>
              <div class="row" style="margin-bottom: 14px">
                <button type="button" class="btn btn-outline btn-sm" (click)="locate()">📍 Dukaan ki location lagayein</button>
                @if (biz.latitude) { <span class="badge badge-green">{{ biz.latitude.toFixed(4) }}, {{ biz.longitude?.toFixed(4) }}</span> }
              </div>
              <button class="btn btn-primary" type="submit" [disabled]="busy() || bf.invalid">Dukaan banayein</button>
            </form>
          }

          <div class="stack-sm mt">
            @for (b of businesses(); track b.id) {
              <div class="card-flat row-between">
                <div><strong>{{ b.name }}</strong><div class="muted small">{{ b.businessType | human }} · ID {{ b.id }}</div></div>
                <span class="badge" [class]="'badge ' + cls(b.status)">{{ b.status | human }}</span>
              </div>
            } @empty {
              <p class="muted">Abhi koi dukaan nahi. Pehle ek dukaan banayein.</p>
            }
          </div>
        </section>

        <section class="card mt">
          <div class="row-between">
            <h3 style="margin: 0">Mere products ({{ products().length }})</h3>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="!businesses().length" (click)="newProduct()">+ Naya product</button>
          </div>

          @if (form(); as f) {
            <form class="mt" (ngSubmit)="saveProduct()" #pf="ngForm">
              <h3>{{ f.id ? 'Product badlein' : 'Naya product' }}</h3>
              <div class="form-grid">
                <div class="field"><label for="pb">Dukaan</label>
                  <select id="pb" class="select" name="pb" [(ngModel)]="f.businessId" required>
                    @for (b of businesses(); track b.id) { <option [ngValue]="b.id">{{ b.name }}</option> }
                  </select></div>
                <div class="field"><label for="pc">Category</label>
                  <select id="pc" class="select" name="pc" [(ngModel)]="f.categoryId" required>
                    <option [ngValue]="null" disabled>Chuniye</option>
                    @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
                  </select></div>
                <div class="field"><label for="pn">Naam</label><input id="pn" class="input" name="pn" [(ngModel)]="f.name" required minlength="2" maxlength="200" /></div>
                <div class="field"><label for="pr">Price (₹)</label><input id="pr" type="number" step="0.01" min="0.01" class="input" name="pr" [(ngModel)]="f.price" required /></div>
                <div class="field"><label for="ps">Stock</label><input id="ps" type="number" step="0.001" min="0" class="input" name="ps" [(ngModel)]="f.stockQuantity" required /></div>
                <div class="field"><label for="pu">Unit (kg, L, piece)</label><input id="pu" class="input" name="pu" [(ngModel)]="f.unit" maxlength="30" /></div>
              </div>
              <div class="field"><label for="pd">Description</label><textarea id="pd" class="textarea" name="pd" [(ngModel)]="f.description" maxlength="2000"></textarea></div>
              <label class="check"><input type="checkbox" name="pa" [(ngModel)]="f.available" /> Abhi available hai</label>
              <div class="row mt"><button class="btn btn-primary" type="submit" [disabled]="busy() || pf.invalid">Save karein</button><button type="button" class="btn btn-ghost" (click)="form.set(null)">Cancel</button></div>
            </form>
          }

          <div class="table-wrap mt">
            <table class="table">
              <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
              <tbody>
                @for (p of products(); track p.id) {
                  <tr>
                    <td><strong>{{ p.name }}</strong><div class="tiny muted">{{ p.businessName }} · {{ p.categoryName }}</div></td>
                    <td>{{ p.price | inr }}</td>
                    <td>{{ p.stockQuantity }} {{ p.unit }}</td>
                    <td><span class="badge" [class]="'badge ' + cls(p.available ? p.status : 'PAUSED')">{{ p.available ? (p.status | human) : 'Paused' }}</span></td>
                    <td class="right">
                      <button type="button" class="btn btn-ghost btn-sm" (click)="openImages(p)">Photos</button>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="edit(p)">Edit</button>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="remove(p)">Hatayein</button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="center muted" style="padding: 28px">Abhi koi product nahi.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        @if (imgProduct(); as ip) {
          <div class="modal-backdrop" (click)="imgProduct.set(null)">
            <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
              <h3>{{ ip.name }} ki photos</h3>
              <div class="row" style="margin-bottom: 14px">
                @for (im of images(); track im.id) {
                  <div style="position: relative">
                    <img [src]="im.imageUrl" alt="" style="width: 84px; height: 84px; object-fit: cover; border-radius: 12px" />
                    <button type="button" class="icon-btn" style="position: absolute; top: -8px; right: -8px; width: 28px; height: 28px; background: #fff; box-shadow: var(--shadow-sm)" (click)="deleteImage(im)" aria-label="Photo hatayein">✕</button>
                  </div>
                } @empty { <span class="muted small">Abhi koi photo nahi.</span> }
              </div>
              <div class="field"><label for="iu">Photo ka link (URL)</label><input id="iu" class="input" name="iu" [(ngModel)]="imageUrl" placeholder="https://..." /><span class="hint">Pehle photo kisi image hosting par daalein, phir link yahan paste karein.</span></div>
              <div class="row"><button type="button" class="btn btn-primary" [disabled]="!imageUrl.trim() || busy()" (click)="addImage()">Photo jodein</button><button type="button" class="btn btn-ghost" (click)="imgProduct.set(null)">Band karein</button></div>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class SellerPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly seller = inject(SellerService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly isSeller = computed(() => this.auth.hasAnyRole('SELLER', 'ADMIN'));
  readonly businesses = signal<Business[]>([]);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly showBiz = signal(false);
  readonly form = signal<ProductForm | null>(null);
  readonly busy = signal(false);
  readonly roleError = signal('');
  readonly imgProduct = signal<Product | null>(null);
  readonly images = signal<ProductImage[]>([]);
  imageUrl = '';
  cls = badgeClass;

  biz: { name: string; businessType: string; phone: string; description: string; latitude: number | null; longitude: number | null } = {
    name: '',
    businessType: 'KIRANA',
    phone: '',
    description: '',
    latitude: null,
    longitude: null,
  };

  ngOnInit(): void {
    this.catalog.categories().subscribe((c) => this.categories.set(c));
    if (this.isSeller()) this.load();
  }

  load(): void {
    this.seller.myBusinesses().subscribe((b) => this.businesses.set(b));
    this.seller.myProducts().subscribe((p) => this.products.set(p));
  }

  becomeSeller(): void {
    this.busy.set(true);
    this.roleError.set('');
    this.auth.becomeRole('SELLER').subscribe({
      next: () => {
        this.busy.set(false);
        if (this.isSeller()) {
          this.toast.success('Ab aap seller hain! Apni dukaan banayein.');
          this.load();
        } else {
          this.roleError.set('Role nahi mila. Backend mein RoleSelfServiceController (backend-patch) jodein.');
        }
      },
      error: (e) => {
        this.busy.set(false);
        this.roleError.set(errorMessage(e, 'Seller role nahi mil paaya.') + ' (backend-patch/RoleSelfServiceController.java apply karein)');
      },
    });
  }

  locate(): void {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        this.biz.latitude = p.coords.latitude;
        this.biz.longitude = p.coords.longitude;
      },
      () => this.toast.error('Location nahi mil paayi. Browser mein permission dein.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  saveBusiness(): void {
    this.busy.set(true);
    this.seller
      .createBusiness({
        name: this.biz.name.trim(),
        businessType: this.biz.businessType,
        phone: this.biz.phone.trim() || undefined,
        description: this.biz.description.trim() || undefined,
        latitude: this.biz.latitude,
        longitude: this.biz.longitude,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.showBiz.set(false);
          this.toast.success('Dukaan ban gayi!');
          this.biz = { name: '', businessType: 'KIRANA', phone: '', description: '', latitude: null, longitude: null };
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }

  newProduct(): void {
    this.form.set({ id: null, businessId: this.businesses()[0]?.id ?? null, categoryId: null, name: '', description: '', price: null, stockQuantity: null, unit: '', available: true });
  }

  edit(p: Product): void {
    this.form.set({ id: p.id, businessId: p.businessId, categoryId: p.categoryId, name: p.name, description: p.description ?? '', price: p.price, stockQuantity: p.stockQuantity, unit: p.unit ?? '', available: p.available });
  }

  saveProduct(): void {
    const f = this.form();
    if (!f || f.businessId === null || f.categoryId === null || f.price === null || f.stockQuantity === null) return;
    const existing = f.id ? this.products().find((p) => p.id === f.id) : null;
    // slug must be unique: keep the old one on edit, add a short suffix on create
    const slug = existing?.slug ?? `${slugify(f.name)}-${Date.now().toString(36).slice(-4)}`;
    const payload = {
      businessId: f.businessId,
      categoryId: f.categoryId,
      name: f.name.trim(),
      slug,
      description: f.description.trim() || undefined,
      price: Number(f.price),
      stockQuantity: Number(f.stockQuantity),
      unit: f.unit.trim() || undefined,
      available: f.available,
    };
    this.busy.set(true);
    const call = f.id ? this.seller.updateProduct(f.id, payload) : this.seller.createProduct(payload);
    call.subscribe({
      next: () => {
        this.busy.set(false);
        this.form.set(null);
        this.toast.success('Product save ho gaya');
        this.load();
      },
      error: () => this.busy.set(false),
    });
  }

  remove(p: Product): void {
    if (!confirm(`${p.name} hata dein?`)) return;
    this.seller.deleteProduct(p.id).subscribe(() => {
      this.toast.info('Product hata diya gaya');
      this.load();
    });
  }

  openImages(p: Product): void {
    this.imgProduct.set(p);
    this.imageUrl = '';
    this.catalog.images(p.id).subscribe((i) => this.images.set(i));
  }

  addImage(): void {
    const p = this.imgProduct();
    if (!p) return;
    this.busy.set(true);
    this.seller.addImage(p.id, this.imageUrl.trim(), this.images().length).subscribe({
      next: () => {
        this.busy.set(false);
        this.imageUrl = '';
        this.catalog.clearImageCache(p.id);
        this.catalog.images(p.id).subscribe((i) => this.images.set(i));
      },
      error: () => this.busy.set(false),
    });
  }

  deleteImage(im: ProductImage): void {
    const p = this.imgProduct();
    if (!p) return;
    this.seller.deleteImage(p.id, im.id).subscribe(() => {
      this.catalog.clearImageCache(p.id);
      this.images.update((l) => l.filter((x) => x.id !== im.id));
    });
  }
}
