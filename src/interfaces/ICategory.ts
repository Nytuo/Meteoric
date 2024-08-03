export default interface ICategory {
    id: string;
    name: string;
    icon: string;
    games: string;
    filters: string[];
    views: string[];
    background: string;
    count?: number;
}