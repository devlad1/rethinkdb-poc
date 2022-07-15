import { Constants } from "./contants";
import { Entity } from "./entity";

export class Square extends Entity {

    draw(xOffset: number, yOffset: number, ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.strokeRect(xOffset + this.xCoordinate - Constants.LENGTH / 2, yOffset + this.yCoordinate - Constants.LENGTH / 2, Constants.LENGTH, Constants.LENGTH);
    }
}
