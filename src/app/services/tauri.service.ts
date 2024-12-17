import { Injectable } from '@angular/core';
import { listen } from '@tauri-apps/api/event';
import { BehaviorSubject } from 'rxjs';
import IGameLaunchedMessage from '../../interfaces/IGameLaunchMessage';
import { GenericService } from './generic.service';

@Injectable({
	providedIn: 'root',
})
export class TauriService {
	message: any = '';
	messageForGameLaunched: BehaviorSubject<IGameLaunchedMessage> =
		new BehaviorSubject({ gamePID: 0 });

	constructor(private genericService: GenericService) {
		this.listenForMessages();
	}

	getMessagesForGameLaunched() {
		return this.messageForGameLaunched.asObservable();
	}

	private listenForMessages(): void {
		listen('frontend-message', (event) => {
			this.message = event.payload;
			let _message = event.payload as string;
			if (_message.includes('GL')) {
				const end = _message.includes('END');
				console.log('GL message', _message);
				let gamePID = end ? parseInt(
					_message.split('GL-END-')[1],
					10,
				) : parseInt(
					_message.split('GL-')[1],
					10,
				);
				const error = _message.startsWith('E-');
				if (end && !error) {
					gamePID = 0;
				}
				let message: IGameLaunchedMessage = {
					gamePID: gamePID,
					isEnded: end,
					isError: error,
				};
				this.messageForGameLaunched.next(message);
				return;
			}
			let messageParams = (this.message as string).split(/[\[\]]/)[1]
				.split('-');
			let messageTitle = messageParams[0];
			let messageType = messageParams[1];
			let isSticky = messageParams[2]
				? messageParams[2].includes('NL')
				: false;
			let messageLifetime: number =
				(messageParams[2] && !messageParams[2].includes('NL'))
					? parseInt(messageParams[2], 10)
					: 3000;
			let messageContent = _message.split(']')[1];
				this.genericService.sendNotification(
					messageTitle,
					messageContent,
					messageType,
					messageLifetime,
					isSticky,
				);
		}).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}
}
