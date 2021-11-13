// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


const {ccclass, property} = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    @property(cc.SpriteFrame)
    bodyImg: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    turnImgTL: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    turnImgTR: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    turnImgBL: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    turnImgBR: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    apelImg: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    foodImg: cc.SpriteFrame = null;

    @property(cc.Node)
    petunjuk: cc.Node = null;

    @property(cc.Node)
    popup: cc.Node = null;

    @property(cc.Node)
    head: cc.Node = null;

    @property(cc.Node)
    eye1: cc.Node = null;

    @property(cc.Node)
    eye2: cc.Node = null;

    @property(cc.Node)
    tail: cc.Node = null;

    @property(cc.Label)
    labelScore: cc.Label = null;

    @property(cc.Label)
    labelBestScore: cc.Label = null;

    @property(cc.Integer)
    speed: number = 200;

    apel: cc.Node = null;
    food: cc.Node[] = [];

    dots: cc.Vec2[] = [];

    body: cc.Node[] = [];
    turn: cc.Sprite[] = [];

    foodLength: number[] = [];
    prevDotsLength: number = 0;
    bodyLength: number = 100;
    prevKeyCode: number = cc.macro.KEY.right;
    tempKeyCode: number = cc.macro.KEY.right;
    isStart = false;
    startBelok = false;

    totalScore = 0;
    bestScore = 0;

    touchStart : cc.Vec2 = cc.Vec2.ZERO;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.head.zIndex = 2;
        this.tail.zIndex = 2;
        this.petunjuk.zIndex = 3;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        if (cc.sys.isMobile) {
            this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
    }

    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        if (cc.sys.isMobile) {
            this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
    }

    onTouchStart (event: cc.Event.EventTouch) {
        this.touchStart = event.touch.getLocation();
    }

    onTouchEnd (event: cc.Event.EventTouch) {
        let touchEnd = event.touch.getLocation();

        let angle = cc.misc.radiansToDegrees(this.getAngle(this.touchStart, touchEnd));
        cc.log("touch angle: " + angle);

        let eventKeyboard = new cc.Event.EventKeyboard("click", false);

        if (angle > 45 && angle <= 135) eventKeyboard.keyCode = cc.macro.KEY.down;
        else if (angle > -45 && angle <= 45) eventKeyboard.keyCode = cc.macro.KEY.left;
        else if (angle > -135 && angle <= -45) eventKeyboard.keyCode = cc.macro.KEY.up;
        else if ((angle > -225 && angle <= -135) || (angle <= 225 && angle > 135)) eventKeyboard.keyCode = cc.macro.KEY.right;

        this.onKeyDown(eventKeyboard);
    }

    start () {
        this.dots.push(cc.v2(0, 0));
        this.dots.push(cc.v2(-100, 0));
        
        this.updateRender();
        this.generateApple();

        let best = cc.sys.localStorage.getItem("best");
        this.bestScore = Number(best);
        if (isNaN(this.bestScore)) this.bestScore = 0;

        this.labelBestScore.string = ": " + this.bestScore.toString();
    }

    replayClick () {
        if (this.popup.scale < 1) return;
        cc.tween(this.popup).to(0.5, {scale: 0}, {easing: "backIn"}).call(() => {
            this.popup.scale = 0;
            this.dots.splice(0, this.dots.length);
            this.dots.push(cc.v2(0, 0));
            this.dots.push(cc.v2(-100, 0));

            this.apel.removeFromParent();
            this.apel = null;
            this.bodyLength = 100;
            
            this.updateRender();
            this.generateApple();

            this.foodLength.splice(0, this.foodLength.length);

            this.food.forEach((n) => {
                n.removeFromParent();
            });

            this.food.splice(0, this.food.length);

            this.prevKeyCode = cc.macro.KEY.right;

            this.petunjuk.active = true;
            this.startBelok = false;
        }).start();
    }

    showPopUp () {
        if (this.totalScore > this.bestScore) {
            this.bestScore = this.totalScore;
            this.labelBestScore.string = ": " + this.bestScore.toString();
            cc.sys.localStorage.setItem("best", this.bestScore.toString());
        }

        cc.tween(this.popup).to(0.5, {scale: 1}, {easing: "backOut"}).start();
    }

    generateApple () {
        this.apel = new cc.Node("apel");
        let spr = this.apel.addComponent(cc.Sprite);
        spr.spriteFrame = this.apelImg;
        this.apel.zIndex = 0;
        this.node.addChild(this.apel);

        let totCol = this.node.width/50;
        let totRow = this.node.height/50;

        cc.log("totCol: " + totCol);
        cc.log("totRow: " + totRow);

        let loop = true;

        while (loop) {
            this.apel.x = -this.node.width/2 + 25 + (Math.round(Math.random() * (totCol - 1))) * 50;
            this.apel.y = -this.node.height/2 + 25 + (Math.round(Math.random() * (totRow - 1))) * 50;
            loop = this.isCollideWithApple();
        }

        cc.log("aple pos: " + this.apel.getPosition().toString());
    }

    isCollideWithApple () : boolean {
        let apelBB = this.apel.getBoundingBox();

        if (this.head.getBoundingBox().intersects(apelBB)) {
            return true;
        }

        if (this.tail.getBoundingBox().intersects(apelBB)) {
            return true;
        }

        for (let i = 0; i < this.body.length; i++) {
            if (this.body[i].getBoundingBox().intersects(apelBB)) {
                return true;
            }
        }

        for (let i = 0; i < this.turn.length; i++) {
            if (this.turn[i].node.getBoundingBox().intersects(apelBB)) {
                return true;
            }
        }

        return false;
    }

    isCollideWithSelf () : boolean {
        let angle = this.getAngle(this.dots[0], this.dots[1]);
        let p = this.dots[0].clone();
        let a = cc.v2(25, 0);
        a.rotateSelf(angle);
        p.addSelf(a);

        if (this.tail.getBoundingBox().contains(p)) {
            return true;
        }

        for (let i = 0; i < this.body.length; i++) {
            if (this.body[i].getBoundingBox().contains(p)) {
                return true;
            }
        }

        for (let i = 0; i < this.turn.length; i++) {
            if (this.turn[i].node.getBoundingBox().contains(p)) {
                return true;
            }
        }

        return false;
    }

    isCollideWithWall () : boolean {
        let angle = this.getAngle(this.dots[0], this.dots[1]);
        let p = this.dots[0].clone();
        let a = cc.v2(25, 0);
        a.rotateSelf(angle);
        p.addSelf(a);

        let w = this.node.width;
        let h = this.node.height;

        return (p.x <= -w/2 || p.x >= w/2 || p.y <= -h/2 || p.y >= h/2);
    }

    updateRender () {
        let dotLength = this.dots.length;

        this.head.setPosition(this.dots[0]);
        this.head.angle = cc.misc.radiansToDegrees(this.getAngle(this.dots[0], this.dots[1]));

        for (let i = 0; i < dotLength - 1; i++) {
            let mid = this.getMidPoint(this.dots[i], this.dots[i + 1]);
            let width = cc.Vec2.distance(this.dots[i], this.dots[i + 1]) - 50;
            let angleDeg = cc.misc.radiansToDegrees(this.getAngle(this.dots[i], this.dots[i + 1]));

            if (this.body.length > i) {
                this.body[i].setPosition(mid);
                this.body[i].width = width;
                this.body[i].angle = angleDeg;
            }
            else {
                let n = new cc.Node("body");
                let spr = n.addComponent(cc.Sprite);
                spr.spriteFrame = this.bodyImg;
                spr.type = cc.Sprite.Type.TILED;
                spr.sizeMode = cc.Sprite.SizeMode.RAW;
                spr.trim = false;

                n.setPosition(mid);
                n.width = width;
                n.angle = angleDeg;
                n.zIndex = 1;
                this.node.addChild(n);
                this.body.push(n);
            }

            if (i < dotLength - 2) {
                let angleDeg2 = cc.misc.radiansToDegrees(this.getAngle(this.dots[i + 1], this.dots[i + 2]));

                let sprFrame: cc.SpriteFrame = null;
                if ((angleDeg == 180 && angleDeg2 == 90) || (angleDeg == -90 && angleDeg2 == 0)) sprFrame = this.turnImgBL;
                else if ((angleDeg == -90 && angleDeg2 == 180) || (angleDeg == 0 && angleDeg2 == 90)) sprFrame = this.turnImgBR;
                else if ((angleDeg == 90 && angleDeg2 == 0) || (angleDeg == 180 && angleDeg2 == -90)) sprFrame = this.turnImgTL;
                else if ((angleDeg == 90 && angleDeg2 == 180) || (angleDeg == 0 && angleDeg2 == -90)) sprFrame = this.turnImgTR;

                if (this.turn.length > i) {
                    this.turn[i].spriteFrame = sprFrame;
                    this.turn[i].node.setPosition(this.dots[i + 1]);
                    this.turn[i].node.active = true;
                }
                else {
                    let n = new cc.Node("turn");
                    let spr = n.addComponent(cc.Sprite);
                    spr.spriteFrame = sprFrame;
                    spr.sizeMode = cc.Sprite.SizeMode.RAW;
                    spr.trim = false;
                    n.zIndex = 1;

                    n.setPosition(this.dots[i + 1]);
                    this.node.addChild(n);
                    this.turn.push(spr);
                }
            }
        }

        let totBody = dotLength - 1;
        for (let i = totBody; i < this.body.length; i++) {
            this.body[i].removeFromParent();
        }
        this.body.splice(totBody, this.body.length - totBody);

        let totTurn = dotLength - 2;
        for (let i = totTurn; i < this.turn.length; i++) {
            this.turn[i].node.removeFromParent();
        }
        this.turn.splice(totTurn, this.turn.length - totTurn);

        this.tail.setPosition(this.dots[dotLength - 1]);
        this.tail.angle = cc.misc.radiansToDegrees(this.getAngle(this.dots[dotLength - 2], this.dots[dotLength - 1]));

        this.tail.width = 50;

        let tw = cc.Vec2.distance(this.dots[dotLength - 2], this.dots[dotLength - 1]);
        if (tw < 50) {
            if (tw < 20) tw = 20;
            this.tail.width = tw;
        }

        this.prevDotsLength = dotLength;
    }

    onKeyDown (event: cc.Event.EventKeyboard) {
        let arr: number[] = [cc.macro.KEY.up, cc.macro.KEY.right, cc.macro.KEY.down, cc.macro.KEY.left];

        cc.log(arr.indexOf(event.keyCode));

        if (arr.indexOf(event.keyCode) == -1) return;
        if (this.popup.scale > 0) return;

        if (!this.isStart) {
            this.isStart = true;
            this.petunjuk.active = false;
            cc.log("mulai");
            return;
        }

        if (this.startBelok) return;

        if (this.prevKeyCode == arr[0] && event.keyCode == arr[2]) return;
        if (this.prevKeyCode == arr[2] && event.keyCode == arr[0]) return;
        if (this.prevKeyCode == arr[1] && event.keyCode == arr[3]) return;
        if (this.prevKeyCode == arr[3] && event.keyCode == arr[1]) return;

        if (this.prevKeyCode == event.keyCode) return;

        this.startBelok = true;

        this.tempKeyCode = event.keyCode;
    }

    belok () {
        let p = this.dots[0];
        p.x = Math.floor((p.x + 25) / 50) * 50;
        p.y = Math.floor((p.y + 25) / 50) * 50;

        this.dots.splice(1, 0, p.clone());
        this.updateRender();
    }

    getAngle (p1: cc.Vec2, p2: cc.Vec2) : number {
        let pDiff = cc.Vec2.ZERO;
        p1.sub(p2, pDiff);

        return Math.atan2(pDiff.y, pDiff.x);
    }

    getMidPoint (p1: cc.Vec2, p2: cc.Vec2) : cc.Vec2 {
        let mid = cc.Vec2.ZERO;

        cc.Vec2.add(mid, p1, p2);
        mid.divSelf(2);

        return mid;
    }

    lookAtApple () {
        let eye1Pos = this.eye1.getPosition();
        let eye2Pos = this.eye2.getPosition();
        let appleWPos = this.node.convertToWorldSpaceAR(this.apel.getPosition());
        let applePos = this.eye1.parent.convertToNodeSpaceAR(appleWPos);

        let dis1 = cc.Vec2.distance(eye1Pos, applePos);
        let dis2 = cc.Vec2.distance(eye2Pos, applePos);
        let angle1 = this.getAngle(eye1Pos, applePos);
        let angle2 = this.getAngle(eye2Pos, applePos);

        let add1 = cc.v2(dis1 > 7?7:dis1, 0);
        add1.rotateSelf(angle1);
        let add2 = cc.v2(dis2 > 7?7:dis2, 0);
        add2.rotateSelf(angle2);

        let p1 = cc.v2(-11, 12);
        p1.subSelf(add1);

        let p2 = cc.v2(-11, -12);
        p2.subSelf(add2);

        this.eye1.setPosition(p1);
        this.eye2.setPosition(p2);
    }

    update (dt: number) {
        if (!this.isStart) return;

        let dotLength = this.dots.length;

        if (this.prevKeyCode == cc.macro.KEY.right) {
            this.dots[0].x += this.speed * dt;
        }
        else if (this.prevKeyCode == cc.macro.KEY.left) {
            this.dots[0].x -= this.speed * dt;
        }
        else if (this.prevKeyCode == cc.macro.KEY.up) {
            this.dots[0].y += this.speed * dt;
        }
        else if (this.prevKeyCode == cc.macro.KEY.down) {
            this.dots[0].y -= this.speed * dt;
        }

        if (this.isCollideWithSelf() || this.isCollideWithWall()) {
            this.isStart = false;
            this.showPopUp();
        }

        let totalLength = 0;

        for (let i = 0; i < this.dots.length - 1; i++) {
            totalLength += cc.Vec2.distance(this.dots[i], this.dots[i + 1]);
        }

        let diff = totalLength - this.bodyLength;

        if (this.dots[dotLength - 2].x == this.dots[dotLength - 1].x) {
            if (this.dots[dotLength - 2].y > this.dots[dotLength - 1].y) {
                this.dots[dotLength - 1].y += diff;
            }
            else if (this.dots[dotLength - 2].y < this.dots[dotLength - 1].y) {
                this.dots[dotLength - 1].y -= diff;
            }
        }
        else if (this.dots[dotLength - 2].y == this.dots[dotLength - 1].y) {
            if (this.dots[dotLength - 2].x > this.dots[dotLength - 1].x) {
                this.dots[dotLength - 1].x += diff;
            }
            else if (this.dots[dotLength - 2].x < this.dots[dotLength - 1].x) {
                this.dots[dotLength - 1].x -= diff;
            }
        }

        if (cc.Vec2.distance(this.dots[dotLength - 2], this.dots[dotLength - 1]) < 10) {
            this.dots.splice(dotLength - 1, 1);
        }

        this.updateRender();

        if (this.startBelok) {
            let p = cc.v2(this.dots[0].x, this.dots[0].y);
            p.x = Math.floor((p.x + 25) / 50) * 50;
            p.y = Math.floor((p.y + 25) / 50) * 50;

            cc.log("s: " + (this.speed * dt));
            cc.log("distance: " + cc.Vec2.distance(p, this.dots[0]));

            if (cc.Vec2.distance(p, this.dots[0]) <= this.speed * dt) {
                this.prevKeyCode = this.tempKeyCode;
                cc.log("belok");
                this.belok();
                this.startBelok = false;
            }
        }

        if (this.apel != null) {
            this.lookAtApple();

            if (cc.Vec2.distance(this.dots[0], this.apel.getPosition()) < this.speed * dt) {
                this.apel.removeFromParent();
                this.apel = null;

                this.generateApple();

                this.totalScore ++;
                this.labelScore.string = ": " + this.totalScore.toString();

                let f = new cc.Node();
                f.setPosition(this.dots[0]);
                let spr = f.addComponent(cc.Sprite);
                spr.spriteFrame = this.foodImg;
                this.node.addChild(f);
                this.food.push(f);

                this.foodLength.push(0);
            }
        }

        for (let i = 0; i < this.food.length; i++) {
            this.foodLength[i] += this.speed * dt * 2;
    
            let totalLength = 0;

            for (let j = 0; j < this.dots.length - 1; j++) {
                let length = cc.Vec2.distance(this.dots[j], this.dots[j + 1]);
                totalLength += length;

                if (this.foodLength[i] < totalLength) {
                    let pos = this.dots[j].clone();
                    
                    let diff = totalLength - this.foodLength[i];
                    let diffV2 = this.dots[j + 1].sub(this.dots[j]);
                    let percent = 1 - (diff / length);
                    let add = diffV2.mul(percent);
                    pos.addSelf(add);
                    

                    this.food[i].setPosition(pos);
                    break;
                }
            }

            if (this.foodLength[i] >= totalLength) {
                this.bodyLength += 50;

                this.food[i].removeFromParent();
                this.food.splice(i, 1);
                this.foodLength.splice(i, 1);
                i--;

                if (this.dots[dotLength - 2].x == this.dots[dotLength - 1].x) {
                    this.dots[dotLength - 1].y += 50;
                }
                else if (this.dots[dotLength - 2].y == this.dots[dotLength - 1].y) {
                    this.dots[dotLength - 1].x += 50;
                }
            }
        }

        
    }
}
