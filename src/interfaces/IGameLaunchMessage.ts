export default interface IGameLaunchedMessage {
	gamePID: number;
	isError?: boolean;
	errorMessage?: string;
	isEnded?: boolean;
}
