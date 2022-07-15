import { Constants } from "./contants";
import { Entity } from "./entity";

export class Square extends Entity {

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
        ctx.stroke();
        ctx.strokeRect(- Constants.LENGTH / 2, - Constants.LENGTH / 2, Constants.LENGTH, Constants.LENGTH);

        ctx.setTransform(initialTransform)
    }
}
