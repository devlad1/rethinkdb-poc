import { Entity } from "./entities/entity";

export class Point {
    longitude: number
    latitude: number

    constructor(longitude: number, latitude: number) {
        this.longitude = longitude;
        this.latitude = latitude;
    }

    static distance(p1: Point, p2: Point) {
        return Math.sqrt(Math.pow(p2.longitude - p1.longitude, 2) + Math.pow(p2.longitude - p1.longitude, 2))
    }
}

export class Zoom {
    public static readonly MAX_LONG = 180.0
    public static readonly MAX_LAT = 90.0
    public static readonly MAX_DIAG_LEN = 80.0;
    public static readonly MIN_DIAG_LEN = 3.0;

    topLeft: Point
    buttomRight: Point

    constructor(topLeft: Point, buttomRight: Point) {
        this.topLeft = topLeft
        this.buttomRight = buttomRight

        if (topLeft.latitude < buttomRight.latitude || topLeft.longitude > buttomRight.longitude) {
            throw new Error(`Illegal arguments for zoom: ${topLeft.latitude} < ${buttomRight.latitude} || ${topLeft.longitude} > ${buttomRight.longitude}`)
        }
    }

    get width(): number {
        return this.buttomRight.longitude - this.topLeft.longitude
    }

    get height(): number {
        return this.topLeft.latitude - this.buttomRight.latitude
    }

    toString(): string {
        return `top left: (${this.topLeft.longitude.toFixed(2)}, ${this.topLeft.latitude.toFixed(2)}) \
            buttom right: (${this.buttomRight.longitude.toFixed(2)}, ${this.buttomRight.latitude.toFixed(2)})`
    }

    addLong(long: number): void {
        if (this.buttomRight.longitude + long < Zoom.MAX_LONG && this.topLeft.longitude + long > -Zoom.MAX_LONG) {
            this.topLeft.longitude += long
            this.buttomRight.longitude += long
        }
    }

    addLat(lat: number): void {
        if (this.topLeft.latitude + lat < Zoom.MAX_LAT && this.buttomRight.latitude + lat > -Zoom.MAX_LAT) {
            this.topLeft.latitude += lat
            this.buttomRight.latitude += lat
        }
    }
}


export enum Op {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
}

export class Message {
    op: Op
    entity: Entity

    constructor(op: Op, entity: Entity) {
        this.op = op;
        this.entity = entity;
    }
}

