export interface User {
    id: number;
    name: string;
    email: string;
    created_at: string
}

export interface shortUrl {
    id: number;
    original_url: string;
    short_code: string;
    clicks: number;
    user_id: number;
    created_at: string

}