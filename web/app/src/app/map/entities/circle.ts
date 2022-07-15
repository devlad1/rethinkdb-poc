import { Constants } from "./contants";
import { Entity } from "./entity";

export class Circle extends Entity {

    draw(xOffset: number, yOffset: number, ctx: CanvasRenderingContext2D): void {
        let entityCenterX = xOffset + this.xCoordinate;
        let entityCenterY = yOffset + this.yCoordinate;
        let angle = Math.asin(this.yVelocity / this.xVelocity)

        ctx.strokeStyle = this.color;

        let initialTransform = ctx.getTransform()
        ctx.translate(entityCenterX, entityCenterY)
        ctx.rotate(angle)

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Constants.LENGTH, 0);
        ctx.arc(0, 0, Constants.LENGTH / 2, 0, 2 * Math.PI)
        ctx.stroke();

        ctx.setTransform(initialTransform)
    }
}
