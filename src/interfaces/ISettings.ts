export default interface ISettings {
    view?: 'list' | 'card';
    sort?: 'asc' | 'desc';
    filter?: 'all' | 'favorite';
    gap?: number;
    zoom?: number;
    displayInfo?: any;
}