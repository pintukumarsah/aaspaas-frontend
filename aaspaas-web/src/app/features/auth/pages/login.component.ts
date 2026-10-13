import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const AUTH_STYLES = `
:host{display:block}.auth-page{min-height:680px;display:grid;grid-template-columns:minmax(0,1fr) minmax(420px, .88fr);background:#fff}.auth-visual{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;min-height:680px;padding:clamp(34px,5vw,78px);background:linear-gradient(145deg,#fff4ef 0%,#fff0ed 46%,#ffe2dd 100%)}.auth-visual:after{content:'';position:absolute;width:540px;height:540px;border:1px solid #f3c8bf;border-radius:50%;right:-200px;top:110px;box-shadow:0 0 0 55px #f6d6ce55,0 0 0 110px #f6d6ce38;pointer-events:none}.visual-orb{position:absolute;border-radius:50%;filter:blur(1px)}.orb-one{width:210px;height:210px;background:linear-gradient(145deg,#ffb59e,#f86c65);right:9%;top:18%;opacity:.18}.orb-two{width:110px;height:110px;background:#ef625d;right:24%;bottom:20%;opacity:.1}.visual-content{position:relative;z-index:1;max-width:520px;margin:auto 0}.eyebrow{display:inline-flex;align-items:center;gap:9px;color:#b94a49;font-size:10px;letter-spacing:1.8px;font-weight:800}.live-dot{width:7px;height:7px;border-radius:50%;background:#f05258;box-shadow:0 0 0 4px #f0525818}.visual-content h1{font-family:Manrope,sans-serif;font-size:clamp(45px,5.4vw,76px);line-height:1.05;letter-spacing:-3.8px;margin:27px 0 20px;font-weight:800;color:#25232b}.visual-content h1 em{font-style:normal;color:#ef5756}.visual-content>p{max-width:390px;font-size:14px;line-height:1.9;color:#77717a}.visual-stats{display:flex;gap:42px;margin-top:40px}.visual-stats b,.visual-stats small{display:block}.visual-stats b{font-size:13px;color:#3c3338}.visual-stats small{font-size:11px;color:#92818a;margin-top:5px}.floating-card{display:flex;align-items:center;gap:13px;max-width:340px;margin-top:45px;padding:15px 17px;background:#ffffffc9;border:1px solid #fff;border-radius:16px;box-shadow:0 14px 40px #b75b4b14;backdrop-filter:blur(10px)}.float-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#fff0e9;color:#e65b53;font-size:20px}.floating-card b,.floating-card small{display:block}.floating-card b{font-size:11px}.floating-card small{font-size:10px;color:#96909a;margin-top:4px}.float-arrow{margin-left:auto;color:#e65b53}.visual-bottom{position:relative;z-index:1;font-size:10px;color:#a08e94;letter-spacing:.2px}.visual-bottom span{color:#ed6961;margin-right:7px}.auth-panel{display:flex;align-items:center;justify-content:center;padding:55px clamp(28px,6vw,100px)}.auth-form-wrap{width:100%;max-width:390px}.mobile-brand{display:none}.form-kicker{font-size:10px;letter-spacing:2px;font-weight:800;color:#f05258}.form-heading h2{font-family:Manrope,sans-serif;font-size:31px;letter-spacing:-1.2px;margin:11px 0 8px;color:#252632}.form-heading p{font-size:12px;color:#9395a0;margin:0 0 27px}.google-btn{position:relative;width:100%;height:49px;border:1px solid #e7e8ed;background:#fff;border-radius:11px;color:#333541;font-size:12px;font-weight:700;cursor:pointer;transition:.2s}.google-btn:hover{background:#fafafa;border-color:#cfd2da}.google-g{position:absolute;left:17px;top:13px;font-size:18px;font-weight:800;color:#4285f4}.btn-arrow{position:absolute;right:16px;color:#9b9da7;font-size:16px}.or-divider{display:flex;align-items:center;gap:13px;margin:23px 0;color:#a1a2ac}.or-divider span{height:1px;background:#ececf0;flex:1}.or-divider small{font-size:10px;white-space:nowrap}.auth-form-wrap form label{display:block;font-size:11px;font-weight:700;color:#454652;margin:0 0 9px}.input-wrap{height:48px;display:flex;align-items:center;gap:11px;border:1px solid #e6e7ec;border-radius:10px;padding:0 13px;margin-bottom:19px;transition:.2s}.input-wrap:focus-within{border-color:#f07873;box-shadow:0 0 0 3px #f0525810}.input-wrap>span{color:#a1a3ad;font-size:15px}.input-wrap input{border:0;outline:0;min-width:0;flex:1;font-size:12px;color:#30313d;background:transparent}.input-wrap input::placeholder{color:#b5b6bf}.label-row{display:flex;justify-content:space-between;align-items:center}.label-row a,.terms a{font-size:10px;color:#ed5557;text-decoration:none;font-weight:700}.eye-btn{border:0;background:transparent;color:#898b97;font-size:10px;cursor:pointer}.submit-btn{width:100%;height:49px;border:0;border-radius:11px;background:#f05258;color:white;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer;box-shadow:0 8px 18px #f0525828;transition:.2s}.submit-btn:hover:not(:disabled){background:#e7474e;transform:translateY(-1px)}.submit-btn:disabled{opacity:.55;cursor:not-allowed}.submit-btn span{font-size:17px}.switch-auth{text-align:center;font-size:11px;color:#777986;margin:25px 0 0}.switch-auth a{color:#e94f55;text-decoration:none;font-weight:800;margin-left:3px}.terms{text-align:center;font-size:9px;color:#a4a5ae;line-height:1.7;margin-top:33px}.terms a{font-size:9px}.message{font-size:11px;line-height:1.5;margin:-7px 0 13px}.error{color:#d9363e}.info{color:#626c85}@media(max-width:900px){.auth-page{grid-template-columns:minmax(0,.9fr) minmax(390px,1fr)}.auth-visual{padding:35px}.visual-content h1{font-size:52px;letter-spacing:-2.5px}.auth-panel{padding:40px 30px}}@media(max-width:700px){.auth-page{display:block;min-height:0}.auth-visual{display:none}.auth-panel{padding:34px 22px 50px;min-height:650px;align-items:flex-start}.auth-form-wrap{margin:auto}.mobile-brand{display:flex;align-items:center;gap:9px;margin-bottom:42px;font-size:22px;letter-spacing:-1px}.mobile-brand b span{color:#ef5756}.mobile-brand .brand-mark{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:linear-gradient(140deg,#ff765e,#ef3e56);color:#fff;font-size:25px}.form-heading h2{font-size:28px}}
`;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <section class="auth-page">
    <div class="auth-visual">
      <div class="visual-orb orb-one"></div><div class="visual-orb orb-two"></div>
      <div class="visual-content">
        <span class="eyebrow"><span class="live-dot"></span> YOUR NEIGHBOURHOOD, REIMAGINED</span>
        <h1>Good things<br>are <em>closer</em><br>than you think.</h1>
        <p>Shop local favourites, discover trusted services and get what you need — all around the corner.</p>
        <div class="visual-stats"><div><b>Local first</b><small>Made for your area</small></div><div><b>One simple app</b><small>Everything nearby</small></div></div>
        <div class="floating-card"><span class="float-icon">✦</span><span><b>Your community, connected</b><small>Little shops. Big convenience.</small></span><span class="float-arrow">↗</span></div>
      </div>
      <div class="visual-bottom"><span>●</span> Made for everyday India</div>
    </div>
    <div class="auth-panel">
      <div class="auth-form-wrap">
        <div class="mobile-brand"><span class="brand-mark">a</span><b>Aaspaas<span>.</span></b></div>
        <div class="form-heading"><span class="form-kicker">WELCOME BACK</span><h2>Sign in to Aaspaas</h2><p>Your neighbourhood is just a tap away.</p></div>
        <button class="google-btn" type="button" (click)="googleLogin()"><span class="google-g">G</span> Continue with Google <span class="btn-arrow">↗</span></button>
        <div class="or-divider"><span></span><small>or continue with email</small><span></span></div>
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <label for="email">Email address</label>
          <div class="input-wrap"><span>✉</span><input id="email" name="email" [(ngModel)]="email" type="email" placeholder="you@example.com" autocomplete="email" required email /></div>
          <div class="label-row"><label for="password">Password</label><a href="javascript:void(0)" (click)="showForgotMessage()">Forgot password?</a></div>
          <div class="input-wrap"><span>♙</span><input id="password" name="password" [(ngModel)]="password" [type]="showPassword ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password" required minlength="8" /><button class="eye-btn" type="button" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">{{showPassword ? 'Hide' : 'Show'}}</button></div>
          <p class="message error" *ngIf="errorMessage">{{errorMessage}}</p><p class="message info" *ngIf="infoMessage">{{infoMessage}}</p>
          <button class="submit-btn" type="submit" [disabled]="loading || loginForm.invalid">{{loading ? 'Signing you in…' : 'Sign in'}}<span>→</span></button>
        </form>
        <p class="switch-auth">New to Aaspaas? <a routerLink="/auth/register">Create an account <span>↗</span></a></p>
        <p class="terms">By continuing, you agree to our <a href="javascript:void(0)">Terms</a> and <a href="javascript:void(0)">Privacy Policy</a>.</p>
      </div>
    </div>
  </section>`,
  styles: [AUTH_STYLES]
})
export class LoginComponent {
  private auth = inject(AuthService); 
  private router = inject(Router);
  email = ''; 
  password = ''; 
  errorMessage = ''; 
  infoMessage = ''; 
  loading = false; 
  showPassword = false;

  onLogin(): void {
    if (this.loading || !this.email.trim() || !this.password) return;
    this.loading = true; 
    this.errorMessage = ''; 
    this.infoMessage = '';
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/home']); },
      error: err => { this.loading = false; this.errorMessage = err?.error?.message || 'Sign in failed. Check your email and password, then try again.'; }
    });
  }

  googleLogin(): void {
    window.location.href = `${environment.apiUrl.replace(/\/api\/?$/, '')}/oauth2/authorization/google`;
  }

  showForgotMessage(): void { 
    this.infoMessage = 'Password reset is not configured yet. Please contact support or use your existing password.'; 
  }
}