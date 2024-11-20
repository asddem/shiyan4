// 创建一个新的Phaser游戏实例
// 参数依次为：游戏宽度、游戏高度、渲染类型（这里是使用CANVAS渲染）、
// 父容器（这里为null，表示直接渲染到页面）、包含预加载、创建、更新等阶段函数的对象
var game = new Phaser.Game(480, 300, Phaser.CANVAS, null, {
    preload: preload,
    create: create,
    update: update
});

// 定义游戏中的各种元素变量
var ball;
var paddle;
var bricks;
var newBrick;
var brickInfo;
var scoreText;
var score = 0;
var lives = 3;
var livesText;
var lifeLostText;
var playing = false;
var startButton;

// 预加载阶段函数，用于加载游戏所需的各种资源
function preload() {
    // 设置游戏缩放模式为显示全部内容，保证游戏在不同尺寸屏幕上能完整显示
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    // 水平方向上页面内容居中对齐
    game.scale.pageAlignHorizontally = true;
    // 垂直方向上页面内容居中对齐
    game.scale.pageAlignVertically = true;
    // 设置游戏舞台的背景颜色为浅灰色
    game.stage.backgroundColor = '#eee';

    // 加载球的图片资源，用于游戏中的球元素
    game.load.image('ball', 'images/ball.png');
    // 加载球拍的图片资源，用于游戏中的球拍元素
    game.load.image('paddle', 'images/paddle.png');
    // 加载砖块的图片资源，用于游戏中的砖块元素
    game.load.image('brick', 'images/brick.png');
    // 加载球的精灵表资源，用于实现球的动画效果（这里是摆动效果）
    game.load.spritesheet('ball', 'images/wobble.png', 20, 20);
    // 加载按钮的精灵表资源，用于游戏开始按钮等按钮元素
    game.load.spritesheet('button', 'images/button.png', 120, 40);
}

// 创建阶段函数，用于创建游戏中的各种对象和设置初始状态
function create() {
    // 启动Phaser的物理系统，这里使用的是ARCADE物理引擎
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // 创建球的精灵对象，初始位置设置在指定坐标（这里是(50, 250)），并指定使用的图片资源为'ball'
    ball = game.add.sprite(50, 250, 'ball');
    // 为球添加一个名为'wobble'的动画，指定动画帧序列和播放帧率
    ball.animations.add('wobble', [0, 1, 0, 2, 0, 1, 0, 2, 0], 24);
    // 设置球的锚点为中心（0.5表示中心位置），方便进行旋转、缩放等操作时以中心为基准
    ball.anchor.set(0.5);
    // 启用球的物理属性，使其能参与物理模拟，使用的是ARCADE物理引擎
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    // 设置球与游戏世界边界发生碰撞时的行为，这里设置为允许碰撞
    ball.body.collideWorldBounds = true;
    // 设置球的反弹系数，这里设置为完全反弹（1表示反弹后速度不变）
    ball.body.bounce.set(1);
    // 设置球的初始速度向量，这里是向右上方运动
    ball.body.velocity.set(150, -150);

    // 创建球拍的精灵对象，初始位置设置在场景的水平中心、底部上方一点的位置，并指定使用的图片资源为'paddle'
    paddle = game.add.sprite(game.world.width * 0.5, game.world.height - 5, 'paddle');
    // 设置球拍的锚点，水平方向为中心（0.5），垂直方向为底部（1），方便进行位置调整等操作
    paddle.anchor.set(0.5, 1);
    // 启用球拍的物理属性，使其能参与物理模拟，使用的是ARCADE物理引擎
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    // 设置球拍为不可移动的物体，在与其他物体碰撞时不会改变自身位置
    paddle.body.immovable = true;

    // 设置物理引擎在检测碰撞时不检查下方的碰撞情况（具体应用场景可能因游戏逻辑而异）
    game.physics.arcade.checkCollision.down = false;
    // 设置球在超出游戏世界边界时进行相关检测（以便后续处理球出界的情况）
    ball.checkWorldBounds = true;
    // 为球添加一个事件监听器，当球超出游戏世界边界时调用ballLeaveScreen函数，并传入当前对象作为上下文
    ball.events.onOutOfBounds.add(ballLeaveScreen, this);

    // 调用函数初始化砖块
    initBricks();

    // 设置文本样式，用于显示游戏中的得分、生命等信息
    textStyle = { font: '18px Arial', fill: '#0095DD' };
    // 创建用于显示得分的文本对象，初始内容为'Points: 0'，位置在左上角（5, 5），并应用设置好的文本样式
    scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
    // 创建用于显示剩余生命数的文本对象，初始内容根据当前生命数生成，位置在右上角（game.world.width - 5, 5），并应用设置好的文本样式
    livesText = game.add.text(game.world.width - 5, 5, 'Lives: '+lives, textStyle);
    // 设置生命数文本的锚点为右上角（水平方向靠右对齐，垂直方向顶部对齐）
    livesText.anchor.set(1, 0);
    // 创建用于显示失去生命提示信息的文本对象，初始内容为'Life lost, click to continue'，位置在场景中心，并应用设置好的文本样式
    lifeLostText = game.add.text(game.world.width * 0.5, game.world.height * 0.5, 'Life lost, click to continue', textStyle);
    // 设置失去生命提示信息文本的锚点为中心
    lifeLostText.anchor.set(0.5);
    // 初始时将失去生命提示信息文本设置为不可见
    lifeLostText.visible = false;

    // 创建游戏开始按钮的精灵对象，位置在场景中心，指定使用的精灵表资源为'button'，
    // 点击按钮时调用startGame函数，并传入当前对象作为上下文，同时指定按钮的不同状态对应的帧索引
    startButton = game.add.button(game.world.width * 0.5, game.world.height * 0.5, 'button', startGame, this, 1, 0, 2);
    // 设置开始按钮的锚点为中心
    startButton.anchor.set(0.5);
}

// 更新阶段函数，每一帧都会调用，用于更新游戏中的各种元素状态
function update() {
    // 检测球与球拍之间的碰撞，并在碰撞发生时调用ballHitPaddle函数进行处理
    game.physics.arcade.collide(ball, paddle, ballHitPaddle);
    // 检测球与砖块组之间的碰撞，并在碰撞发生时调用ballHitBrick函数进行处理
    game.physics.arcade.collide(ball, bricks, ballHitBrick);

    // 如果游戏处于正在进行状态（playing为true）
    if(playing) {
        // 根据鼠标输入的x坐标设置球拍的x坐标，如果没有鼠标输入则将球拍保持在场景的水平中心位置
        paddle.x = game.input.x || game.world.width * 0.5;
    }
}

// 初始化砖块的函数，用于创建并设置游戏中的砖块布局
function initBricks() {
    // 定义砖块的相关信息对象，包括宽度、高度、行列数量、偏移量、间距等属性
    brickInfo = {
        width: 50,
        height: 20,
        count: {
            row: 3,
            col: 7
        },
        offset: {
            top: 50,
            left: 60
        },
        padding: 10
    };

    // 创建一个用于管理砖块的组对象，方便对所有砖块进行统一操作
    bricks = game.add.group();

    // 嵌套循环遍历，根据定义的砖块行列数量创建每个砖块的精灵对象，并设置其物理属性和添加到砖块组中
    for(c = 0; c < brickInfo.count.col; c++) {
        for(r = 0; r < brickInfo.count.row; r++) {
            // 计算每个砖块在场景中的x坐标，根据列数、砖块宽度、间距和偏移量来确定
            var brickX = (c * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
            // 计算每个砖块在场景中的y坐标，根据行数、砖块高度、间距和偏移量来确定
            var brickY = (r * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;

            // 创建一个砖块的精灵对象，指定位置和使用的图片资源为'brick'
            newBrick = game.add.sprite(brickX, brickY, 'brick');
            // 启用砖块的物理属性，使其能参与物理模拟，使用的是ARCADE物理引擎
            game.physics.enable(newBrick, Phaser.Physics.ARCADE);
            // 设置砖块为不可移动的物体，在与其他物体碰撞时不会改变自身位置
            newBrick.body.immovable = true;
            // 设置砖块的锚点为中心（0.5表示中心位置），方便进行旋转、缩放等操作时以中心为基准
            newBrick.anchor.set(0.5);

            // 将创建好的砖块添加到砖块组中
            bricks.add(newBrick);
        }
    }
}

// 当球与砖块发生碰撞时调用的函数
function ballHitBrick(ball, brick) {
    // 创建一个用于改变砖块缩放的补间动画对象
    var killTween = game.add.tween(brick.scale);
    // 设置补间动画的目标缩放值为(0, 0)，即缩放到消失，动画持续时间为200毫秒，使用线性缓动效果
    killTween.to({x:0,y:0}, 200, Phaser.Easing.Linear.None);
    // 为补间动画添加一个完成事件监听器，当动画完成时调用匿名函数，在匿名函数中销毁对应的砖块对象
    killTween.onComplete.addOnce(function(){
        brick.kill();
    }, this);
    // 启动补间动画
    killTween.start();

    // 增加得分，每次击中砖块增加10分
    score += 10;
    // 更新显示得分的文本内容
    scoreText.setText('Points: '+score);

    // 统计剩余存活的砖块数量
    var count_alive = 0;
    for (i = 0; i < bricks.children.length; i++) {
      if (bricks.children[i].alive == true) {
        count_alive++;
      }
    }

    // 如果所有砖块都被摧毁（剩余存活砖块数量为0）
    if (count_alive == 0) {
      // 弹出提示框告知玩家获胜信息
      alert('You won the game, congratulations!');
      // 刷新页面，重新开始游戏（这里可以根据需求进行更灵活的游戏结束处理方式）
      location.reload();
    }
}

// 当球超出游戏世界边界时调用的函数
function ballLeaveScreen() {
    // 减少剩余生命数
    lives--;

    // 如果还有剩余生命数
    if(lives) {
        // 更新显示剩余生命数的文本内容
        livesText.setText('Lives: '+lives);
        // 显示失去生命的提示信息文本
        lifeLostText.visible = true;
        // 将球重置到初始位置（这里是场景水平中心、底部上方一点的位置）
        ball.reset(game.world.width * 0.5, game.world.height - 25);
        // 将球拍重置到初始位置（场景的水平中心、底部上方一点的位置）
        paddle.reset(game.world.width * 0.5, game.world.height - 5);

        // 为鼠标按下事件添加一个一次性的监听器，当鼠标按下时执行匿名函数
        game.input.onDown.addOnce(function(){
            // 隐藏失去生命的提示信息文本
            lifeLostText.visible = false;
            // 重新设置球的初始速度向量，使其继续向右上方运动
            ball.body.velocity.set(150, -150);
        }, this);
    }
    // 如果没有剩余生命数，游戏结束
    else {
        // 弹出提示框告知玩家游戏失败信息
        alert('You lost, game over!');
        // 刷新页面，重新开始游戏（这里可以根据需求进行更灵活的游戏结束处理方式）
        location.reload();
    }
}

// 当球与球拍发生碰撞时调用的函数
function ballHitPaddle(ball, paddle) {
    // 播放球的'wobble'动画，实现球与球拍碰撞时的动画效果
    ball.animations.play('wobble');
    // 根据球与球拍碰撞的位置调整球的水平速度，实现不同位置碰撞后球的反弹方向和速度变化
    ball.body.velocity.x = -1 * 5 * (paddle.x - ball.x);
}

// 游戏开始按钮点击时调用的函数
function startGame() {
    // 销毁游戏开始按钮对象
    startButton.destroy();
    // 设置球的初始速度向量，使其开始运动
    ball.body.velocity.set(150, -150);
    // 将游戏状态设置为正在进行
    playing = true;
}