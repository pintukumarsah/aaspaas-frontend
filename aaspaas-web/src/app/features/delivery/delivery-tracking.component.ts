import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Client } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-delivery-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 24px;">
      <h2>Live Delivery Status</h2>
      <p>Connection: <strong>{{ isConnected ? 'Live' : 'Disconnected' }}</strong></p>
      <div *ngIf="currentLocation">
        <p>Latitude: {{ currentLocation.latitude }}</p>
        <p>Longitude: {{ currentLocation.longitude }}</p>
      </div>
    </div>
  `
})
export class DeliveryTrackingComponent implements OnInit, OnDestroy {
  private stompClient!: Client;
  isConnected = false;
  currentLocation: any = null;

  ngOnInit(): void {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    const token = localStorage.getItem('access_token');
    this.stompClient = new Client({
      brokerURL: environment.wsUrl.replace('http', 'ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        this.isConnected = true;
        this.stompClient.subscribe('/topic/delivery-tracking', (message) => {
          this.currentLocation = JSON.parse(message.body);
        });
      },
      onDisconnect: () => {
        this.isConnected = false;
      }
    });
    this.stompClient.activate();
  }

  ngOnDestroy(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}