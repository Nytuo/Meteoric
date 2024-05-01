import IGame from "./IGame";

export default interface ICategory {
    id: number;
    name: string;
    icon: string;
    games: string[];
    filters: string[];
    views: string[];
    background: string;
}