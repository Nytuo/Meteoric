import { Injectable } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class TauriService {
  message: any = '';
  messageForLoadingBar: BehaviorSubject<string> = new BehaviorSubject('');

  possibleMessages = ['ROUTINE_IGDB_TOTAL', 'ROUTINE_IGDB_STATUS', 'ROUTINE_IGDB_NAME'];

  get getPossibleMessages(): string[] {
    return this.possibleMessages;
  }

  get getMessage(): string {
    return this.message;
  }

  getMessagesForLoadingBar() {
    return this.messageForLoadingBar.asObservable();
  }

  constructor() {
    this.listenForMessages();
  }

  private listenForMessages(): void {
    listen('frontend-message', (event) => {
      this.message = event.payload;
      if ((this.message as string).startsWith('ROUTINE_IGDB')) {
        this.messageForLoadingBar.next(this.message);
      }
    }).catch((error) => {
      console.error('Error listening to message-event', error);
    });
  }
}
