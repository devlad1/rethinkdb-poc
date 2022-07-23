import { Entity } from "../map/entities/entity";

export class EntityState {
    entity: Entity
    alive: boolean

    constructor(entity: Entity, alive: boolean) {
        this.entity = entity
        this.alive = alive
    }
}