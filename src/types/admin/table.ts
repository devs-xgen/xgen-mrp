import { TableMeta } from "@tanstack/react-table"
import { UserData } from "./user"

export interface UserTableMeta {
    onEdit: (user: UserData) => void
    onDelete: (user: UserData) => void
    onStatusChange: (userId: string, newStatus: string) => void
}

// This combines the base TableMeta with our custom meta
export type ExtendedTableMeta = TableMeta<UserData> & UserTableMeta