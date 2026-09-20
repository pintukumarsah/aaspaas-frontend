import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeliveryTrackingService {

  private client!: Client;

  connect(assignmentId: number): Observable<any> {

    return new Observable(observer => {

      this.client = new Client({
        brokerURL: 'ws://localhost:9090/ws',

        reconnectDelay: 5000,

        onConnect: () => {

          this.client.subscribe(
            `/topic/delivery/${assignmentId}`,
            message => {

              observer.next(
                JSON.parse(message.body)
              );

            }
          );
        },

        onStompError: error => {

          observer.error(error);
        }
      });

      this.client.activate();

      return () => {
        this.client.deactivate();
      };
    });
  }
}