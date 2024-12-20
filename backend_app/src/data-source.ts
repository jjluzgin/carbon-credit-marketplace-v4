import "reflect-metadata"
import { DataSource } from "typeorm"
import { Project } from "./entity/Project.entity"
import { TokenHolding } from "./entity/TokenHolding.entity"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: true,
    logging: false,
    entities: [Project, TokenHolding],
    migrations: [],
    subscribers: [],
})
