export default interface ISettings {
	view?: 'list' | 'card';
	sort?: 'asc' | 'desc';
	filter?: 'all' | 'favorite';
	gap?: string;
	zoom?: string;
	displayInfo?: any;
}
