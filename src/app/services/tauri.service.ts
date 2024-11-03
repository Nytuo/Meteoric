import { Injectable } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { BehaviorSubject } from 'rxjs';
import IGameLaunchedMessage from '../../interfaces/IGameLaunchMessage';
import { MessageService } from 'primeng/api';

@Injectable({
	providedIn: 'root',
})
export class TauriService {
	message: any = '';
	messageForGameLaunched: BehaviorSubject<IGameLaunchedMessage> =
		new BehaviorSubject({ gamePID: 0 });

	constructor(private messageService: MessageService) {
		this.listenForMessages();
	}

	getMessagesForGameLaunched() {
		return this.messageForGameLaunched.asObservable();
	}

	sendNotification(
		title: string = 'title',
		message: string = 'message',
		type: string = 'info',
		duration: number = 3000,
	) {
		this.messageService.add({
			severity: type,
			summary: title,
			detail: message,
			life: duration,
		});
	}

	private listenForMessages(): void {
		listen('frontend-message', (event) => {
			this.message = event.payload;
			if ((this.message as string).includes('-GL-')) {
				const end = (this.message as string).includes('END');
				let gamePID = parseInt(
					(this.message as string).split('-GL-')[1],
					10,
				);
				const error = (this.message as string).startsWith('E-');
				if (end && !error) {
					gamePID = 0;
				}
				let message: IGameLaunchedMessage = {
					gamePID: gamePID,
					isEnded: end,
					isError: error,
				};
				this.messageForGameLaunched.next(message);
			} else {
				this.sendNotification('Information', this.message, 'info');
			}
		}).catch((error) => {
			this.sendNotification('Error', error, 'error');
		});
	}
}
