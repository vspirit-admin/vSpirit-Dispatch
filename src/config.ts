import 'dotenv/config'

export const aalPilots: string[] = process.env.AAL_PILOTS?.split(',') ?? [];
