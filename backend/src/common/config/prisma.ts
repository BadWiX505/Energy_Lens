import 'dotenv/config'
import { PrismaClient } from '../../generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// 1. Create a function that initializes your Edge-ready client
const prismaClientSingleton = () => {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  })
  return new PrismaClient({ adapter })
}

// 2. Declare a global variable to hold the cached instance
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton> // ReturnType is a TS utility that generate automatically the type of a given function 
}

// 3. Export the cached instance if it exists, otherwise create a new one
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// 4. In development, save the instance to the global object
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma 
}