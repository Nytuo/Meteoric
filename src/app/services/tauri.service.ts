import { Injectable } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { BehaviorSubject } from 'rxjs';
import IGameLaunchedMessage from '../../interfaces/IGameLaunchMessage';
@Injectable({
  providedIn: 'root'
})
export class TauriService {
  message: any = '';
  messageForLoadingBar: BehaviorSubject<string> = new BehaviorSubject('');
  messageForGameLaunched: BehaviorSubject<IGameLaunchedMessage> = new BehaviorSubject({ gamePID: 0 });

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

  getMessagesForGameLaunched() {
    return this.messageForGameLaunched.asObservable();
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
      if ((this.message as string).includes('-GL-')) {
        const end = (this.message as string).includes('END');
        let gamePID = parseInt((this.message as string).split('-GL-')[1], 10);
        const error = (this.message as string).startsWith('E-');
        if (end && !error) {
          gamePID = 0;
        }
        let message: IGameLaunchedMessage = { gamePID: gamePID, isEnded: end, isError: error };
        this.messageForGameLaunched.next(message);
      }
    }).catch((error) => {
      console.error('Error listening to message-event', error);
    });
  }
}
