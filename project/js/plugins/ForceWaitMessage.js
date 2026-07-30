//=============================================================================
// RPG Maker MZ - ForceWaitMessage.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 指定秒数のあいだ決定・キャンセルを無効化して文章を強制表示するプラグイン
 * @author (あなたの名前)
 *
 * @help ForceWaitMessage.js
 *
 * 指定した秒数のあいだ、決定キー(長押し含む)やキャンセルキー、
 * マウスクリック、タッチでは文章を送れないようにします。
 * 指定秒数が経過したあとは、通常どおり決定キーで文章を閉じられます。
 *
 * ■使い方
 * イベントコマンド「プラグインコマンド」から「強制待機文章」を選び、
 * 引数に秒数・文章(最大3行)・背景・位置を指定してください。
 *
 * 文章の各行には制御文字がそのまま使えます。
 * 例: \FS[25]、\C[2]、\V[1] など
 * (プラグインコマンドの入力欄では \ をそのまま1個で書いてください。
 *  スクリプトのようにエスケープする必要はありません。)
 *
 * ■注意
 * ・空欄の行は表示されません(不要な行は空のままでOK)。
 * ・待機中はメニューやイベントの並列処理は通常どおり動きます。
 *
 * @command showForceWait
 * @text 強制待機文章
 * @desc 指定秒数だけ入力を無効化して文章を表示します。
 *
 * @arg waitSeconds
 * @text 待機秒数
 * @desc この秒数が経過するまで決定・キャンセルを受け付けません。
 * @type number
 * @decimals 1
 * @min 0
 * @default 3
 *
 * @arg line1
 * @text 文章1行目
 * @desc 1行目の文章。制御文字(\FS[25]など)が使えます。
 * @type string
 * @default
 *
 * @arg line2
 * @text 文章2行目
 * @desc 2行目の文章。空欄なら表示しません。
 * @type string
 * @default
 *
 * @arg line3
 * @text 文章3行目
 * @desc 3行目の文章。空欄なら表示しません。
 * @type string
 * @default
 *
 * @arg line4
 * @text 文章4行目
 * @desc 4行目の文章。空欄なら表示しません。
 * @type string
 * @default
 *
 * @arg background
 * @text 背景
 * @desc 文章ウィンドウの背景。
 * @type select
 * @option 通常
 * @value 0
 * @option 暗くする
 * @value 1
 * @option 透明
 * @value 2
 * @default 0
 *
 * @arg positionType
 * @text 表示位置
 * @desc 文章ウィンドウの表示位置。
 * @type select
 * @option 上
 * @value 0
 * @option 中
 * @value 1
 * @option 下
 * @value 2
 * @default 2
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "ForceWaitMessage";

    PluginManager.registerCommand(PLUGIN_NAME, "showForceWait", function (args) {
        const seconds = Number(args.waitSeconds || 0);
        const frames = Math.round(seconds * 60);
        const background = Number(args.background || 0);
        const positionType = Number(args.positionType || 2);

        // 空でない行だけを追加
        const lines = [args.line1, args.line2, args.line3, args.line4];

        $gameMessage.setBackground(background);
        $gameMessage.setPositionType(positionType);

        for (const line of lines) {
            if (line !== undefined && line !== null && line !== "") {
                $gameMessage.add(line);
            }
        }

        // 強制待機フレーム数を伝える(次に開くメッセージウィンドウで使用)
        $gameTemp.setForceWaitFrames(frames);

        // 文章が閉じるまでこのイベントを待機させる
        this.setWaitMode("message");
    });

    //-----------------------------------------------------------------------
    // Game_Temp
    // 強制待機フレーム数を一時的に保持する
    //-----------------------------------------------------------------------
    const _Game_Temp_initialize = Game_Temp.prototype.initialize;
    Game_Temp.prototype.initialize = function () {
        _Game_Temp_initialize.call(this);
        this._forceWaitFrames = 0;
    };

    Game_Temp.prototype.setForceWaitFrames = function (frames) {
        this._forceWaitFrames = frames || 0;
    };

    Game_Temp.prototype.forceWaitFrames = function () {
        return this._forceWaitFrames || 0;
    };

    Game_Temp.prototype.clearForceWaitFrames = function () {
        this._forceWaitFrames = 0;
    };

    //-----------------------------------------------------------------------
    // Window_Message
    // 強制待機カウンタが残っているあいだは入力を無視する
    //-----------------------------------------------------------------------
    const _Window_Message_startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function () {
        // メッセージ開始時に強制待機カウンタを取り込む
        this._forceWaitCount = $gameTemp.forceWaitFrames();
        $gameTemp.clearForceWaitFrames();
        _Window_Message_startMessage.call(this);
    };

    // 毎フレーム、強制待機カウンタを減らす
    const _Window_Message_update = Window_Message.prototype.update;
    Window_Message.prototype.update = function () {
        if (this._forceWaitCount && this._forceWaitCount > 0) {
            this._forceWaitCount--;
        }
        _Window_Message_update.call(this);
    };

    // 強制待機中は決定・キャンセルの入力判定を無効化する。
    // 文章の描画処理には手を加えないので、表示は通常どおり進む。
    const _Window_Message_isTriggered = Window_Message.prototype.isTriggered;
    Window_Message.prototype.isTriggered = function () {
        if (this._forceWaitCount && this._forceWaitCount > 0) {
            return false;
        }
        return _Window_Message_isTriggered.call(this);
    };

    // 念のため初期化
    const _Window_Message_initialize = Window_Message.prototype.initialize;
    Window_Message.prototype.initialize = function (rect) {
        _Window_Message_initialize.call(this, rect);
        this._forceWaitCount = 0;
    };
})();
