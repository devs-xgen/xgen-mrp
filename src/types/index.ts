import { Product as PrismaProduct, ProductCategory as PrismaProductCategory } from "@prisma/client"


export * from './admin'
// export * from './worker' next na wala pa iniimport


export type Product = PrismaProduct
export type ProductCategory = PrismaProductCategory