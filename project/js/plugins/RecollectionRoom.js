//=============================================================================
// RecollectionRoom.js
//=============================================================================
/*:ja
 * @target MZ
 * @plugindesc 回想部屋プラグイン - 3×3サムネイルギャラリー形式
 * @author Claude / Custom
 * @url https://example.com
 *
 * @help
 * ============================================================================
 * 概要
 * ============================================================================
 * サムネイル一覧から選択して回想イベントを再生する「回想部屋」を実装します。
 * 想定解像度: 1920×1080（フルHD）
 * レイアウト: 3列×3段 = 1ページ9枚、最大4ページ（32件対応）
 *
 * 各回想イベントは「専用マップ」に配置されている前提です。
 * サムネイル選択後、そのマップへ自動転送し、マップ内の
 * プラグインコマンド「回想終了」で起動元へ復帰します。
 *
 * ============================================================================
 * 使い方
 * ============================================================================
 *
 * 【1】サムネイル画像を配置
 *   img/pictures/ フォルダに 16:9 の画像ファイルを配置してください。
 *   推奨サイズ: 480×270（等倍）または 960×540（Retina用）
 *
 * 【2】プラグインパラメータで各回想を設定
 *   下の「回想イベント一覧」で 32 件それぞれ設定:
 *     - タイトル: サムネ下部に表示される名前
 *     - サムネイル画像: img/pictures/ 内のファイル（ファイル選択）
 *     - 開放スイッチID: このスイッチONで開放扱いになる
 *     - 再生先マップID: 回想イベントが配置されているマップ
 *     - 実行するイベントID: そのマップ上のどのイベントを再生するか
 *     - プレイヤー配置X/Y: マップ内でプレイヤーが立つ位置
 *
 * 【3】NPCに起動イベントを配置
 *   NPCのイベントで「プラグインコマンド」→「RecollectionRoom > 回想部屋を開く」
 *
 * 【4】各回想イベントの終端に復帰コマンドを配置
 *   各イベントの最終行に「プラグインコマンド」→
 *   「RecollectionRoom > 回想終了・起動元へ戻る」
 *   これで自動的にNPCの位置へ戻ります。
 *
 * ============================================================================
 * 同一マップ上の他イベントを抑制したい場合
 * ============================================================================
 * 回想イベントと同じマップにオートイベント等がある場合、
 * 回想再生中に暴発しないように「回想再生中スイッチID」を設定してください。
 * このスイッチは以下のように自動制御されます:
 *   - 回想再生開始時に自動ON
 *   - 「回想終了」コマンド実行時に自動OFF
 *
 * 抑制したいオートイベント側の「出現条件」で、
 * このスイッチが「OFF」であることを条件にすればOK。
 *
 * スクリプトから状態を参照する場合:
 *   $gameSystem.isRecollectionActive()  // 回想中なら true
 *
 * ============================================================================
 * 操作方法（プレイヤー）
 * ============================================================================
 *   ↑↓←→ ...... サムネイル選択
 *   Q / W ...... ページ切替
 *   Z / Enter ... 再生
 *   X / Esc ..... 回想部屋を閉じる
 *
 * ============================================================================
 * ライセンス
 * ============================================================================
 * 自由に使用・改変・再配布可能。クレジット表記不要。
 *
 * ============================================================================
 * @param recollections
 * @text 回想イベント一覧
 * @type struct<Recollection>[]
 * @default []
 * @desc 32件までの回想イベントリスト。順番通りに表示されます。
 *
 * @param recollectionActiveSwitch
 * @text 回想再生中スイッチID
 * @type switch
 * @default 0
 * @desc 回想再生中に自動でON→終了時にOFFになるスイッチ。0なら未使用。同一マップの他イベント抑制用。
 *
 * @param returnToRoomOnEnd
 * @text 回想終了後に回想部屋へ戻る
 * @type boolean
 * @on 回想部屋に戻る
 * @off 起動元マップに戻る
 * @default true
 * @desc ON: 回想終了時に回想部屋（選択画面）へ戻ります。回想部屋を閉じた時に起動元マップへ戻ります。
 *
 * @param roomBgm
 * @text 回想部屋BGM
 * @type struct<RoomBgm>
 * @desc 回想部屋（選択画面）で再生するBGM。ファイル・音量・ピッチ・パンをまとめて設定できます。未設定ならBGMを変更しません。
 *
 * @param debugUnlockAll
 * @text テストプレイで全開放
 * @type boolean
 * @default false
 * @desc ON: テストプレイ中に限り、開放スイッチの状態に関係なく全ての回想を開放済みとして表示・再生できます。製品版には影響しません。
 *
 * @param roomCloseSwitch
 * @text 回想部屋終了時OFFスイッチ
 * @type switch
 * @default 0
 * @desc 回想部屋を閉じて起動元マップへ戻る時に、自動でOFFになるスイッチ。0なら未使用。
 *
 * @param roomCloseOnSwitch
 * @text 回想部屋終了時ONスイッチ
 * @type switch
 * @default 0
 * @desc 回想部屋を閉じて起動元マップへ戻る時に、自動でONになるスイッチ。0なら未使用。
 *
 * @param roomCloseCommonEvent
 * @text 回想部屋終了時コモンイベント
 * @type common_event
 * @default 0
 * @desc 回想部屋を閉じて起動元マップへ戻った直後に実行するコモンイベント。0なら未使用。
 *
 * @param playbackEndSwitch
 * @text 回想終了時ONスイッチ
 * @type switch
 * @default 0
 * @desc プラグインコマンド「回想終了」の実行時に、自動でONになるスイッチ。0なら未使用。
 *
 * @param itemsPerPage
 * @text 1ページの表示枚数
 * @type number
 * @default 9
 * @min 1
 * @desc 3×3=9推奨。列数×行数と一致させてください。
 *
 * @param cols
 * @text グリッド列数
 * @type number
 * @default 3
 * @min 1
 *
 * @param rows
 * @text グリッド行数
 * @type number
 * @default 3
 * @min 1
 *
 * @param headerTitle
 * @text ヘッダータイトル
 * @type string
 * @default 回 想 録
 *
 * @param headerSubtitle
 * @text ヘッダーサブタイトル
 * @type string
 * @default RECOLLECTION
 *
 * @param lockedText
 * @text 未開放時の表示テキスト
 * @type string
 * @default ？？？
 *
 * @param accentColor
 * @text アクセントカラー（金色）
 * @type string
 * @default #d4a857
 *
 * @param bgColor
 * @text 背景色
 * @type string
 * @default #13172a
 *
 * @param lockedBgColor
 * @text 未開放サムネ背景色
 * @type string
 * @default #1c1f2e
 *
 * @param textColor
 * @text メインテキスト色
 * @type string
 * @default #e8e4d8
 *
 * @param mutedColor
 * @text ミュートテキスト色
 * @type string
 * @default #8a8478
 *
 * @param lockedIconColor
 * @text 鍵アイコン色
 * @type string
 * @default #5a5d6e
 *
 * @command open
 * @text 回想部屋を開く
 * @desc 回想部屋UIを表示します。NPCイベントから呼び出してください。
 *
 * @command end
 * @text 回想終了・起動元へ戻る
 * @desc 回想マップの終端で呼び出してください。起動元NPCの位置へ戻ります。
 */

/*~struct~Recollection:ja
 * @param title
 * @text タイトル
 * @type string
 * @default 新しい回想
 * @desc サムネイル下部に表示される名前
 *
 * @param thumbnail
 * @text サムネイル画像
 * @type file
 * @dir img/pictures
 * @desc img/pictures/ 内の画像ファイル（拡張子なし）を選択してください。
 *
 * @param switchId
 * @text 開放スイッチID
 * @type switch
 * @default 1
 * @desc このスイッチがONの時、開放済み扱いになります
 *
 * @param mapId
 * @text 再生先マップID
 * @type number
 * @default 1
 * @min 1
 * @desc 回想イベントが配置されているマップのID
 *
 * @param eventId
 * @text 実行するイベントID
 * @type number
 * @default 1
 * @min 1
 * @desc 上記マップ上の、このイベントID番号のイベントだけを自動起動します。
 *
 * @param pageIndex
 * @text 実行するEVページ番号
 * @type number
 * @default 0
 * @min 0
 * @desc 0=自動（出現条件を満たす有効ページを実行）。1以上を指定すると、出現条件を無視してそのページ番号の内容を直接実行します。
 *
 * @param startX
 * @text プレイヤー配置X座標
 * @type number
 * @default 0
 * @min 0
 * @desc マップ内でプレイヤーが立つ位置X（イベント本体の位置とは別で可）
 *
 * @param startY
 * @text プレイヤー配置Y座標
 * @type number
 * @default 0
 * @min 0
 * @desc マップ内でプレイヤーが立つ位置Y
 */

/*~struct~RoomBgm:ja
 * @param name
 * @text ファイル
 * @type file
 * @dir audio/bgm
 * @desc 再生するBGMファイル
 *
 * @param volume
 * @text 音量
 * @type number
 * @default 90
 * @min 0
 * @max 100
 * @desc BGMの音量（0～100）
 *
 * @param pitch
 * @text ピッチ
 * @type number
 * @default 100
 * @min 50
 * @max 150
 * @desc BGMのピッチ（50～150、通常は100）
 *
 * @param pan
 * @text 位相（パン）
 * @type number
 * @default 0
 * @min -100
 * @max 100
 * @desc 左右の定位（-100=左、0=中央、100=右）
 */

(() => {
    'use strict';

    const pluginName = 'RecollectionRoom';
    const rawParams = PluginManager.parameters(pluginName);

    //-------------------------------------------------------------------------
    // Parameter parsing
    //-------------------------------------------------------------------------
    const parseRecollections = (raw) => {
        try {
            const list = JSON.parse(raw || '[]');
            return list.map((entry, i) => {
                const p = JSON.parse(entry);
                // Normalize: trim + strip accidental extension
                const thumbnail = String(p.thumbnail || '')
                    .trim()
                    .replace(/\.(png|jpg|jpeg|webp|gif)$/i, '');
                const title = String(p.title || `Event ${i + 1}`);
                if (!thumbnail) {
                    console.warn(
                        `[${pluginName}] 回想${i + 1}「${title}」: ` +
                        `サムネイル画像が未設定です（プラグインパラメータを確認してください）`
                    );
                }
                return {
                    index: i + 1,
                    title: title,
                    thumbnail: thumbnail,
                    switchId: Number(p.switchId || 0),
                    mapId: Number(p.mapId || 1),
                    eventId: Number(p.eventId || 1),
                    pageIndex: Number(p.pageIndex || 0),
                    startX: Number(p.startX || 0),
                    startY: Number(p.startY || 0)
                };
            });
        } catch (e) {
            console.error(`[${pluginName}] Failed to parse recollections`, e);
            return [];
        }
    };

    const parseRoomBgm = (raw) => {
        if (!raw) return null;
        // New format: struct JSON {name, volume, pitch, pan}
        try {
            const p = JSON.parse(raw);
            if (p && typeof p === 'object') {
                const name = String(p.name || '').trim();
                if (!name) return null;
                return {
                    name: name,
                    volume: Number(p.volume || 90),
                    pitch: Number(p.pitch || 100),
                    pan: Number(p.pan || 0)
                };
            }
        } catch (e) {
            // Not JSON -> old plain file-name format, fall through
        }
        const name = String(raw).trim();
        if (!name) return null;
        return {
            name: name,
            volume: Number(rawParams.roomBgmVolume || 90),
            pitch: Number(rawParams.roomBgmPitch || 100),
            pan: 0
        };
    };

    const CONFIG = {
        recollections: parseRecollections(rawParams.recollections),
        recollectionActiveSwitch: Number(rawParams.recollectionActiveSwitch || 0),
        returnToRoomOnEnd: rawParams.returnToRoomOnEnd !== 'false',
        roomBgm: parseRoomBgm(rawParams.roomBgm),
        debugUnlockAll: rawParams.debugUnlockAll === 'true',
        roomCloseSwitch: Number(rawParams.roomCloseSwitch || 0),
        roomCloseOnSwitch: Number(rawParams.roomCloseOnSwitch || 0),
        roomCloseCommonEvent: Number(rawParams.roomCloseCommonEvent || 0),
        playbackEndSwitch: Number(rawParams.playbackEndSwitch || 0),
        itemsPerPage: Number(rawParams.itemsPerPage || 9),
        cols: Number(rawParams.cols || 3),
        rows: Number(rawParams.rows || 3),
        headerTitle: String(rawParams.headerTitle || '回 想 録'),
        headerSubtitle: String(rawParams.headerSubtitle || 'RECOLLECTION'),
        lockedText: String(rawParams.lockedText || '？？？'),
        accentColor: String(rawParams.accentColor || '#d4a857'),
        bgColor: String(rawParams.bgColor || '#13172a'),
        lockedBgColor: String(rawParams.lockedBgColor || '#1c1f2e'),
        textColor: String(rawParams.textColor || '#e8e4d8'),
        mutedColor: String(rawParams.mutedColor || '#8a8478'),
        lockedIconColor: String(rawParams.lockedIconColor || '#5a5d6e')
    };

    // Shared unlock check. With debugUnlockAll ON, everything is treated
    // as unlocked, but only during test play (never in a deployed game).
    const isUnlocked = (item) => {
        if (!item) return false;
        if (CONFIG.debugUnlockAll && Utils.isOptionValid('test')) return true;
        return item.switchId > 0 && $gameSwitches.value(item.switchId);
    };

    //-------------------------------------------------------------------------
    // Game_System extensions - origin snapshot & pending event
    //-------------------------------------------------------------------------
    Game_System.prototype.saveRecollectionAudio = function() {
        // Save the field BGM/BGS once, when the room is first opened.
        if (this._recollectionAudio) return;
        this._recollectionAudio = {
            bgm: AudioManager.saveBgm(),
            bgs: AudioManager.saveBgs()
        };
    };

    Game_System.prototype.restoreRecollectionAudio = function() {
        const a = this._recollectionAudio;
        if (!a) return;
        AudioManager.replayBgm(a.bgm);
        AudioManager.replayBgs(a.bgs);
        this._recollectionAudio = null;
    };

    Game_System.prototype.hasRecollectionOrigin = function() {
        return !!this._recollectionOrigin;
    };

    Game_System.prototype.saveRecollectionOrigin = function() {
        // Don't overwrite: when re-selecting from the room after a playback,
        // the current map is the previous playback map, not the true origin.
        if (this._recollectionOrigin) return;
        this._recollectionOrigin = {
            mapId: $gameMap.mapId(),
            x: $gamePlayer.x,
            y: $gamePlayer.y,
            direction: $gamePlayer.direction()
        };
    };

    Game_System.prototype.restoreRecollectionOrigin = function() {
        const o = this._recollectionOrigin;
        if (!o) return;
        $gamePlayer.reserveTransfer(o.mapId, o.x, o.y, o.direction, 0);
        this._recollectionOrigin = null;
    };

    Game_System.prototype.setPendingRecollectionEvent = function(eventId, pageIndex) {
        this._pendingRecollectionEventId = eventId;
        this._pendingRecollectionPageIndex = Number(pageIndex) || 0;
    };

    Game_System.prototype.consumePendingRecollectionEvent = function() {
        const id = this._pendingRecollectionEventId;
        const pageIndex = this._pendingRecollectionPageIndex || 0;
        this._pendingRecollectionEventId = null;
        this._pendingRecollectionPageIndex = 0;
        return id ? { eventId: id, pageIndex: pageIndex } : null;
    };

    Game_System.prototype.setRecollectionActive = function(active) {
        this._recollectionActive = !!active;
        if (CONFIG.recollectionActiveSwitch > 0) {
            $gameSwitches.setValue(CONFIG.recollectionActiveSwitch, !!active);
        }
    };

    Game_System.prototype.isRecollectionActive = function() {
        return !!this._recollectionActive;
    };

    //-------------------------------------------------------------------------
    // Scene_Map hook - auto-start pending recollection event after transfer
    //-------------------------------------------------------------------------
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        const pending = $gameSystem.consumePendingRecollectionEvent();
        if (!pending) return;

        const abort = (msg) => {
            console.warn(`[${pluginName}] ${msg}`);
            // Fallback: return to origin so player isn't stuck
            $gameSystem.setRecollectionActive(false);
            $gameSystem.restoreRecollectionOrigin();
        };

        const event = $gameMap.event(pending.eventId);
        if (!event) {
            abort(`Event ID ${pending.eventId} not found on map ${$gameMap.mapId()}`);
            return;
        }

        if (pending.pageIndex > 0) {
            // Forced page mode: run the specified EV page directly,
            // ignoring its page conditions.
            const data = event.event();
            const page = data && data.pages ? data.pages[pending.pageIndex - 1] : null;
            if (page && page.list) {
                $gameMap._interpreter.setup(page.list, pending.eventId);
            } else {
                abort(
                    `Event ID ${pending.eventId} has no page ${pending.pageIndex} ` +
                    `(pages: ${data && data.pages ? data.pages.length : 0})`
                );
            }
        } else {
            // Auto mode: start the currently active page.
            // Make sure the active page reflects current switch states.
            event.refresh();
            if (event.page()) {
                event.start();
            } else {
                abort(
                    `Event ID ${pending.eventId} on map ${$gameMap.mapId()} has no active page. ` +
                    `Check the event page conditions (switches / self switches / variables), ` +
                    `or set pageIndex in the plugin parameters to force a specific page.`
                );
            }
        }
    };

    //-------------------------------------------------------------------------
    // Event-start suppression / interpreter hygiene
    //-------------------------------------------------------------------------
    const _Game_Map_updateInterpreter = Game_Map.prototype.updateInterpreter;
    Game_Map.prototype.updateInterpreter = function() {
        if (pendingInterpreterClear) {
            pendingInterpreterClear = false;
            this._interpreter.clear();
        }
        _Game_Map_updateInterpreter.call(this);
    };

    const _Game_Map_setupStartingEvent = Game_Map.prototype.setupStartingEvent;
    Game_Map.prototype.setupStartingEvent = function() {
        if (suppressMapEvents) return false;
        return _Game_Map_setupStartingEvent.call(this);
    };

    // Once the player has actually arrived on a (new) map, normal event
    // processing may resume.
    const _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        _Game_Player_performTransfer.call(this);
        suppressMapEvents = false;
    };

    //-------------------------------------------------------------------------
    // Spriteset_Map hook - solid background during recollection playback
    //-------------------------------------------------------------------------
    // While a recollection is active, the map (tiles, characters, weather)
    // is covered by a full-screen sprite filled with CONFIG.bgColor, the same
    // color as the selection screen. Pictures, messages and choice windows
    // are rendered above it, so event content stays fully visible.
    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._createRecollectionBackground();
    };

    Spriteset_Map.prototype._createRecollectionBackground = function() {
        const sprite = new Sprite();
        const bmp = new Bitmap(Graphics.width, Graphics.height);
        bmp.fillAll(CONFIG.bgColor);
        sprite.bitmap = bmp;
        sprite.visible = $gameSystem.isRecollectionActive();
        this._recollectionBackSprite = sprite;
        this._baseSprite.addChild(sprite);
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        // Latch: once shown, the overlay stays visible for the lifetime of
        // this spriteset (= this map). Turning it off mid-scene would expose
        // the map for a few frames before the scene actually changes.
        // A new map creates a new spriteset, which starts hidden.
        if (this._recollectionBackSprite && $gameSystem.isRecollectionActive()) {
            this._recollectionBackSprite.visible = true;
        }
    };

    //-------------------------------------------------------------------------
    // Plugin commands
    //-------------------------------------------------------------------------
    PluginManager.registerCommand(pluginName, 'open', () => {
        SceneManager.push(Scene_Recollection);
    });

    // Set when a playback ends; consumed by Scene_Recollection.start()
    // to run cleanup after the scene has switched (so the map is never
    // exposed between "end" and the room being shown).
    let pendingRoomCleanup = false;

    // Page/index of the recollection the player last started, used to
    // restore the cursor when returning to the room after a playback.
    let lastPlayedSelection = null;

    // While true, map events are prevented from (re)starting. Used to keep
    // auto-run recollection events from restarting during the fade-out
    // after 回想終了, and stale interpreters from resuming after transfers.
    let suppressMapEvents = false;

    // When true, the map interpreter is wiped at the start of the next
    // Game_Map.updateInterpreter call (a moment when it is safe to do so).
    let pendingInterpreterClear = false;

    // NOTE: a regular function (not an arrow function) is required here
    // because PluginManager binds `this` to the running Game_Interpreter.
    PluginManager.registerCommand(pluginName, 'end', function() {
        // Freeze this event chain exactly where it is. The map interpreter
        // must NOT be cleared synchronously here: when 回想終了 runs inside
        // a common event (a child interpreter), clearing the parent while
        // it is mid-update crashes MZ. Instead we put the whole chain on a
        // long wait (which also freezes any parent interpreters) and wipe
        // it at the start of the next frame, before it can resume - see
        // the Game_Map.updateInterpreter hook below.
        this.wait(600);
        pendingInterpreterClear = true;
        suppressMapEvents = true;
        if (CONFIG.playbackEndSwitch > 0) {
            $gameSwitches.setValue(CONFIG.playbackEndSwitch, true);
        }
        AudioManager.stopSe();
        if (CONFIG.returnToRoomOnEnd) {
            // 1) Fade out the screen and BGM/BGS/ME. The scene change
            //    waits until the fade completes (the scene reports busy
            //    while fading), so nothing below is visible in between.
            // 2) Pictures / tint / overlay are intentionally left as-is
            //    here; they are cleaned up in Scene_Recollection.start()
            //    behind the black screen.
            pendingRoomCleanup = true;
            const scene = SceneManager._scene;
            if (scene && scene.fadeOutAll) {
                scene.fadeOutAll();
            }
            SceneManager.goto(Scene_Recollection);
        } else {
            const scene = SceneManager._scene;
            if (scene && scene.fadeOutAll) {
                scene.fadeOutAll();
            }
            $gameScreen.clear();
            $gameSystem.setRecollectionActive(false);
            if (CONFIG.roomCloseSwitch > 0) {
                $gameSwitches.setValue(CONFIG.roomCloseSwitch, false);
            }
            if (CONFIG.roomCloseOnSwitch > 0) {
                $gameSwitches.setValue(CONFIG.roomCloseOnSwitch, true);
            }
            if (CONFIG.roomCloseCommonEvent > 0) {
                // Runs once the player has arrived back on the origin map
                // (reserved common events wait until the map is ready).
                $gameTemp.reserveCommonEvent(CONFIG.roomCloseCommonEvent);
            }
            $gameSystem.restoreRecollectionAudio();
            $gameSystem.restoreRecollectionOrigin();
        }
    });

    //-------------------------------------------------------------------------
    // Layout calculator
    //-------------------------------------------------------------------------
    const Layout = {
        get screenW() { return Graphics.width; },
        get screenH() { return Graphics.height; },
        get headerH() { return Math.floor(this.screenH * 0.13); },
        get footerH() { return Math.floor(this.screenH * 0.056); },
        get gridTop() { return this.headerH + 20; },
        get gridBottom() { return this.screenH - this.footerH - 15; },
        get gridH() { return this.gridBottom - this.gridTop; },
        get gridAreaW() { return Math.floor(this.screenW * 0.92); },
        get gridAreaX() { return Math.floor((this.screenW - this.gridAreaW) / 2); },
        get gap() { return Math.max(12, Math.floor(this.screenW * 0.011)); },

        calcThumbSize() {
            const gap = this.gap;
            // Width-bound size
            let w = Math.floor((this.gridAreaW - (CONFIG.cols - 1) * gap) / CONFIG.cols);
            let h = Math.floor(w * 9 / 16);
            // If height overflows, constrain by height
            const requiredH = h * CONFIG.rows + gap * (CONFIG.rows - 1);
            if (requiredH > this.gridH) {
                h = Math.floor((this.gridH - gap * (CONFIG.rows - 1)) / CONFIG.rows);
                w = Math.floor(h * 16 / 9);
            }
            return { w, h };
        },

        calcGridOrigin(thumbW) {
            const totalW = CONFIG.cols * thumbW + (CONFIG.cols - 1) * this.gap;
            const x = Math.floor((this.screenW - totalW) / 2);
            return { x, y: this.gridTop };
        }
    };

    //-------------------------------------------------------------------------
    // Sprite_RecollectionPageButton - clickable page arrows for mouse users
    //-------------------------------------------------------------------------
    class Sprite_RecollectionPageButton extends Sprite_Clickable {
        initialize(direction, clickHandler) {
            super.initialize();
            this._dir = direction; // -1 = prev page, +1 = next page
            this._clickHandler = clickHandler;
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.bitmap = new Bitmap(64, 64);
            this._redraw(false);
            this.opacity = 200;
        }

        _redraw(hover) {
            const b = this.bitmap;
            b.clear();
            // Circle background
            b.paintOpacity = hover ? 235 : 180;
            b.drawCircle(32, 32, 30, CONFIG.lockedBgColor);
            b.paintOpacity = 255;
            // Ring
            b.drawCircle(32, 32, 30, hover ? CONFIG.accentColor : '#00000000');
            if (hover) {
                b.drawCircle(32, 32, 27, CONFIG.lockedBgColor);
            }
            // Arrow glyph
            b.fontFace = $gameSystem.mainFontFace();
            b.fontSize = 30;
            b.textColor = CONFIG.accentColor;
            b.drawText(this._dir < 0 ? '◀' : '▶', 0, 16, 64, 32, 'center');
        }

        onMouseEnter() {
            this.opacity = 255;
            this._redraw(true);
        }

        onMouseExit() {
            this.opacity = 200;
            this._redraw(false);
        }

        onClick() {
            if (this.visible && this._clickHandler) {
                this._clickHandler();
            }
        }
    }

    //-------------------------------------------------------------------------
    // Scene_Recollection
    //-------------------------------------------------------------------------
    class Scene_Recollection extends Scene_MenuBase {
        create() {
            super.create();
            this._logDiagnostics();
            this._createBackground();
            this._createHeader();
            this._createGrid();
            if (pendingRoomCleanup && lastPlayedSelection) {
                // Returning from a playback: restore the cursor to the
                // recollection the player just watched.
                this._gridWindow.setPageAndIndex(
                    lastPlayedSelection.page, lastPlayedSelection.index);
            }
            this._createThumbLayer();
            this._createPageButtons();
            this._createSelectionRing();
            this._createFooter();
            this._updateHeaderStats();
            this._updateFooterInfo();
            this._updateSelectionRing();
        }

        _logDiagnostics() {
            // Test-play only: print the state of every recollection entry
            // so config problems (locked switches, missing thumbnails)
            // can be spotted at a glance in the F8 console.
            if (!Utils.isOptionValid('test')) return;
            console.log(`[${pluginName}] ---- 回想部屋 診断 ----`);
            for (const r of CONFIG.recollections) {
                const sw = r.switchId > 0
                    ? `SW${r.switchId}=${$gameSwitches.value(r.switchId) ? 'ON' : 'OFF'}`
                    : 'スイッチ未設定';
                const state = isUnlocked(r) ? '開放' : '未開放(？？？表示)';
                const thumb = r.thumbnail || '(サムネ未設定)';
                console.log(
                    `[${pluginName}] #${r.index}「${r.title}」 ${state} / ${sw} / ` +
                    `サムネ: ${thumb} / マップ${r.mapId} イベント${r.eventId} ページ${r.pageIndex || '自動'}`
                );
            }
        }

        start() {
            super.start();
            if (pendingRoomCleanup) {
                pendingRoomCleanup = false;
                suppressMapEvents = false;
                if (pendingInterpreterClear) {
                    pendingInterpreterClear = false;
                    $gameMap._interpreter.clear();
                }
                // Behind the black screen: erase all pictures and reset
                // tint / flash / shake / zoom / weather / fade state left
                // behind by the recollection event, then silence everything.
                $gameScreen.clear();
                $gameSystem.setRecollectionActive(false);
                AudioManager.stopBgm();
                AudioManager.stopBgs();
                AudioManager.stopMe();
                AudioManager.stopSe();
                // Fade the room in once it's fully built
                this.startFadeIn(this.slowFadeSpeed(), false);
            }
            // Save the field BGM/BGS the first time the room opens
            // (guarded internally, so re-entering after playback won't
            // overwrite the saved field audio).
            $gameSystem.saveRecollectionAudio();
            if (CONFIG.roomBgm) {
                // playBgm is a no-op restart if the same BGM is already
                // playing, so navigating back here won't cause a hiccup.
                AudioManager.playBgm(CONFIG.roomBgm);
            }
        }

        createBackground() {
            // Override Scene_MenuBase's default fuzzy backdrop
            this._backgroundFilter = null;
            this._backgroundSprite = new Sprite();
            this.addChild(this._backgroundSprite);
        }

        _createBackground() {
            const bg = new Sprite();
            bg.bitmap = new Bitmap(Layout.screenW, Layout.screenH);
            bg.bitmap.fillRect(0, 0, Layout.screenW, Layout.screenH, CONFIG.bgColor);
            bg.bitmap.fillRect(0, 0, Layout.screenW, 3, CONFIG.accentColor);
            this.addChild(bg);
        }

        _createHeader() {
            const sprite = new Sprite();
            sprite.bitmap = new Bitmap(Layout.screenW, Layout.headerH);
            this.addChild(sprite);
            this._headerSprite = sprite;

            const b = sprite.bitmap;
            const titleFont = 'serif';

            // Title (JP)
            b.fontFace = titleFont;
            b.fontSize = 46;
            b.fontBold = false;
            b.textColor = CONFIG.accentColor;
            b.drawText(CONFIG.headerTitle, 80, 25, 600, 60);

            // Subtitle (EN)
            b.fontFace = $gameSystem.mainFontFace();
            b.fontSize = 14;
            b.textColor = CONFIG.mutedColor;
            b.drawText(CONFIG.headerSubtitle, 80, 88, 400, 22);

            // Divider line at bottom of header
            b.paintOpacity = 76;
            b.fillRect(80, Layout.headerH - 8, Layout.screenW - 160, 1, CONFIG.accentColor);
            b.paintOpacity = 255;
        }

        _updateHeaderStats() {
            const b = this._headerSprite.bitmap;
            // Clear stats area (right side)
            const clearX = Math.floor(Layout.screenW * 0.7);
            const clearW = Layout.screenW - clearX - 80;
            b.clearRect(clearX, 20, clearW, 80);

            const unlocked = CONFIG.recollections.filter(r => isUnlocked(r)).length;
            const total = CONFIG.recollections.length;
            const currentPage = this._gridWindow ? this._gridWindow.currentPage() + 1 : 1;
            const totalPages = this._gridWindow ? this._gridWindow.totalPages() : 1;

            // Draw stats right-aligned
            const font = $gameSystem.mainFontFace();
            const rightEdge = Layout.screenW - 80;

            b.fontFace = font;

            // PAGE x / y
            const pageText = ` / ${totalPages}`;
            const pageNum = String(currentPage);
            let x = rightEdge;
            b.fontSize = 22;
            b.textColor = CONFIG.mutedColor;
            const pageTextW = b.measureTextWidth(pageText);
            x -= pageTextW;
            b.drawText(pageText, x, 76, pageTextW, 28);

            b.fontSize = 28;
            b.textColor = CONFIG.accentColor;
            const pageNumW = b.measureTextWidth(pageNum) + 6;
            x -= pageNumW;
            b.drawText(pageNum, x, 72, pageNumW, 32);

            b.fontSize = 22;
            b.textColor = CONFIG.mutedColor;
            const pageLabel = 'PAGE　';
            const pageLabelW = b.measureTextWidth(pageLabel);
            x -= pageLabelW;
            b.drawText(pageLabel, x, 76, pageLabelW, 28);

            // Unlocked x / y (to the left)
            x -= 30; // spacing
            const unlockedText = ` / ${total}`;
            const unlockedNum = String(unlocked);
            b.fontSize = 22;
            b.textColor = CONFIG.mutedColor;
            const uTextW = b.measureTextWidth(unlockedText);
            x -= uTextW;
            b.drawText(unlockedText, x, 76, uTextW, 28);

            b.fontSize = 28;
            b.textColor = CONFIG.accentColor;
            const uNumW = b.measureTextWidth(unlockedNum) + 6;
            x -= uNumW;
            b.drawText(unlockedNum, x, 72, uNumW, 32);

            b.fontSize = 22;
            b.textColor = CONFIG.mutedColor;
            const uLabel = '開放　';
            const uLabelW = b.measureTextWidth(uLabel);
            x -= uLabelW;
            b.drawText(uLabel, x, 76, uLabelW, 28);
        }

        _createGrid() {
            const rect = new Rectangle(
                Layout.gridAreaX,
                Layout.gridTop,
                Layout.gridAreaW,
                Layout.gridH
            );
            this._gridWindow = new Window_RecollectionGrid(rect);
            this._gridWindow.setHandler('ok', this.onSelectEvent.bind(this));
            this._gridWindow.setHandler('cancel', this._onCancel.bind(this));
            this._gridWindow.setHandler('pageChanged', this._onPageChanged.bind(this));
            this.addChild(this._gridWindow);
        }

        _createSelectionRing() {
            this._selectionRing = new Sprite();
            this._selectionRing.bitmap = new Bitmap(1, 1);
            this._selectionRing.visible = false;
            this.addChild(this._selectionRing);
        }

        _updateSelectionRing() {
            if (!this._gridWindow) return;
            const idx = this._gridWindow.index();
            const item = this._gridWindow.itemAt(idx);
            if (!item) {
                this._selectionRing.visible = false;
                return;
            }
            const rect = this._gridWindow.thumbRect(idx);
            const pad = 4;
            const s = 3;
            const w = rect.width + pad * 2;
            const h = rect.height + pad * 2;
            const bmp = new Bitmap(w, h);
            const c = CONFIG.accentColor;
            bmp.fillRect(0, 0, w, s, c);
            bmp.fillRect(0, h - s, w, s, c);
            bmp.fillRect(0, 0, s, h, c);
            bmp.fillRect(w - s, 0, s, h, c);
            this._selectionRing.bitmap = bmp;
            this._selectionRing.x = rect.x - pad;
            this._selectionRing.y = rect.y - pad;
            this._selectionRing.visible = true;
        }

        _createFooter() {
            const sprite = new Sprite();
            sprite.bitmap = new Bitmap(Layout.screenW, Layout.footerH + 10);
            sprite.y = Layout.screenH - Layout.footerH - 10;
            this.addChild(sprite);
            this._footerSprite = sprite;

            const b = sprite.bitmap;

            // Divider at top of footer
            b.paintOpacity = 51;
            b.fillRect(80, 0, Layout.screenW - 160, 1, CONFIG.accentColor);
            b.paintOpacity = 255;

            // Controls hint (left)
            b.fontFace = $gameSystem.mainFontFace();
            b.fontSize = 14;
            b.textColor = CONFIG.mutedColor;
            b.fontSize = 18;
            b.drawText('Q W  ページ　　↑↓←→  選択　　Z / Enter  再生　　X / Esc  戻る',
                80, 13, Layout.screenW - 160, 28);
        }

        _updateFooterInfo() {
            const b = this._footerSprite.bitmap;
            const rightX = Math.floor(Layout.screenW * 0.55);
            const clearW = Layout.screenW - rightX - 80;
            b.clearRect(rightX, 13, clearW, 28);

            const item = this._gridWindow ? this._gridWindow.currentItem() : null;
            let text = '';
            if (item) {
                const unlocked = isUnlocked(item);
                text = unlocked ? `選択中：${item.title}` : `選択中：${CONFIG.lockedText}（未開放）`;
            }
            b.fontFace = 'serif';
            b.fontSize = 18;
            b.textColor = CONFIG.mutedColor;
            b.drawText(text, rightX, 13, clearW, 28, 'right');
        }

        _createPageButtons() {
            const win = this._gridWindow;
            const r0 = win.thumbRect(0);
            const totalW = CONFIG.cols * win._thumbW + (CONFIG.cols - 1) * Layout.gap;
            const totalH = CONFIG.rows * win._thumbH + (CONFIG.rows - 1) * Layout.gap;
            const cy = r0.y + Math.floor(totalH / 2);
            const leftCx = Math.max(36, r0.x - 56);
            const rightCx = Math.min(Layout.screenW - 36, r0.x + totalW + 56);

            this._prevPageButton = new Sprite_RecollectionPageButton(-1,
                () => this._gridWindow.changePage(-1, false));
            this._prevPageButton.x = leftCx;
            this._prevPageButton.y = cy;
            this.addChild(this._prevPageButton);

            this._nextPageButton = new Sprite_RecollectionPageButton(1,
                () => this._gridWindow.changePage(1, false));
            this._nextPageButton.x = rightCx;
            this._nextPageButton.y = cy;
            this.addChild(this._nextPageButton);

            this._updatePageButtons();
        }

        _updatePageButtons() {
            const win = this._gridWindow;
            if (this._prevPageButton) {
                this._prevPageButton.visible = win.currentPage() > 0;
            }
            if (this._nextPageButton) {
                this._nextPageButton.visible =
                    win.currentPage() < win.totalPages() - 1;
            }
        }

        _onPageChanged() {
            this._updateHeaderStats();
            this._updateFooterInfo();
            this._updateSelectionRing();
            this._refreshThumbLayer();
            this._updatePageButtons();
        }

        _createThumbLayer() {
            this._thumbLayer = new Sprite();
            this.addChild(this._thumbLayer);
            this._refreshThumbLayer();
        }

        _refreshThumbLayer() {
            const layer = this._thumbLayer;
            while (layer.children.length > 0) {
                layer.removeChildAt(0);
            }
            const win = this._gridWindow;
            const debug = Utils.isOptionValid('test');
            for (let i = 0; i < win.maxItems(); i++) {
                const item = win.itemAt(i);
                if (!item) continue;
                const rect = win.thumbRect(i);
                const unlocked = isUnlocked(item);

                // Base tile sprite (background / locked visuals)
                const base = new Sprite(new Bitmap(rect.width, rect.height));
                base.x = rect.x;
                base.y = rect.y;
                if (unlocked) {
                    this._drawUnlockedBase(base.bitmap, item, rect.width, rect.height);
                } else {
                    this._drawLockedTile(base.bitmap, item, rect.width, rect.height);
                }
                layer.addChild(base);

                if (!unlocked) continue;

                // Thumbnail image sprite (scaled to fit the tile)
                if (item.thumbnail) {
                    const bmp = ImageManager.loadPicture(item.thumbnail);
                    const sp = new Sprite(bmp);
                    sp.x = rect.x;
                    sp.y = rect.y;
                    const fit = () => {
                        if (bmp.width > 0 && bmp.height > 0) {
                            sp.scale.x = rect.width / bmp.width;
                            sp.scale.y = rect.height / bmp.height;
                            if (debug) {
                                console.log(
                                    `[${pluginName}] サムネ描画 #${item.index} ` +
                                    `画像 ${bmp.width}x${bmp.height} -> ` +
                                    `位置(${rect.x},${rect.y}) サイズ ${rect.width}x${rect.height}`
                                );
                            }
                        }
                    };
                    if (bmp.isReady()) {
                        fit();
                    } else {
                        bmp.addLoadListener(fit);
                    }
                    layer.addChild(sp);
                }

                // Overlay sprite (number + title bar) above the image
                const ov = new Sprite(new Bitmap(rect.width, rect.height));
                ov.x = rect.x;
                ov.y = rect.y;
                this._drawTileOverlay(ov.bitmap, item, rect.width, rect.height);
                layer.addChild(ov);
            }
        }

        _drawTileOverlay(b, item, w, h) {
            // Number top-left
            b.fontFace = $gameSystem.mainFontFace();
            b.fontSize = 16;
            b.textColor = CONFIG.accentColor;
            b.drawText(String(item.index).padStart(2, '0'), 10, 6, 40, 22);

            // Title bar
            const barH = Math.floor(h * 0.13);
            b.paintOpacity = 210;
            b.fillRect(0, h - barH, w, barH, '#080a12');
            b.paintOpacity = 102;
            b.fillRect(0, h - barH, w, 1, CONFIG.accentColor);
            b.paintOpacity = 255;

            // Title text
            b.fontFace = 'serif';
            b.fontSize = 20;
            b.textColor = CONFIG.textColor;
            b.drawText(item.title, 0, h - barH, w, barH, 'center');
        }

        _drawUnlockedBase(b, item, w, h) {
            b.fillRect(0, 0, w, h, '#3a4660');
            if (!item.thumbnail) {
                b.fontFace = $gameSystem.mainFontFace();
                b.fontSize = 20;
                b.textColor = CONFIG.mutedColor;
                b.drawText('NO IMAGE', 0, Math.floor(h / 2) - 16, w, 32, 'center');
            }
        }

        _drawLockedTile(b, item, w, h) {
            // Dark background
            b.fillRect(0, 0, w, h, CONFIG.lockedBgColor);

            // Number (faded)
            b.fontFace = $gameSystem.mainFontFace();
            b.fontSize = 16;
            b.paintOpacity = 102;
            b.textColor = CONFIG.accentColor;
            b.drawText(String(item.index).padStart(2, '0'), 10, 6, 40, 22);
            b.paintOpacity = 255;

            // Lock icon (centered)
            const iconSize = Math.floor(h * 0.22);
            const iconX = Math.floor(w / 2 - iconSize / 2);
            const iconY = Math.floor(h / 2 - iconSize * 0.7);
            this._drawLockIconOn(b, iconX, iconY, iconSize);

            // ??? text
            b.fontFace = $gameSystem.mainFontFace();
            b.fontSize = 24;
            b.textColor = CONFIG.lockedIconColor;
            b.drawText(CONFIG.lockedText, 0, Math.floor(h * 0.62), w, 34, 'center');

            // Title bar (same layout as unlocked tiles, muted text)
            const barH = Math.floor(h * 0.13);
            b.paintOpacity = 210;
            b.fillRect(0, h - barH, w, barH, '#080a12');
            b.paintOpacity = 102;
            b.fillRect(0, h - barH, w, 1, CONFIG.lockedIconColor);
            b.paintOpacity = 255;
            b.fontFace = 'serif';
            b.fontSize = 20;
            b.textColor = CONFIG.mutedColor;
            b.drawText(item.title, 0, h - barH, w, barH, 'center');
        }

        _drawLockIconOn(b, x, y, size) {
            const c = CONFIG.lockedIconColor;
            const s = Math.max(2, Math.floor(size / 16));
            // Body: rectangle outline (bottom 2/3)
            const bodyY = y + Math.floor(size * 0.4);
            const bodyH = Math.floor(size * 0.6);
            const bodyW = size;
            b.fillRect(x, bodyY, bodyW, s, c);
            b.fillRect(x, bodyY + bodyH - s, bodyW, s, c);
            b.fillRect(x, bodyY, s, bodyH, c);
            b.fillRect(x + bodyW - s, bodyY, s, bodyH, c);
            // Shackle: U-shape on top (approximated with rects)
            const sx = x + Math.floor(size * 0.2);
            const sy = y + Math.floor(size * 0.05);
            const sw = Math.floor(size * 0.6);
            const sh = Math.floor(size * 0.35);
            b.fillRect(sx, sy, sw, s, c);
            b.fillRect(sx, sy, s, sh, c);
            b.fillRect(sx + sw - s, sy, s, sh, c);
        }

        _onCancel() {
            // If we got here after a playback, transfer back to the origin.
            // restoreRecollectionOrigin() is a no-op when nothing is saved
            // (i.e. the player opened the room and played nothing).
            $gameSystem.setRecollectionActive(false);
            if (CONFIG.roomCloseSwitch > 0) {
                $gameSwitches.setValue(CONFIG.roomCloseSwitch, false);
            }
            if (CONFIG.roomCloseOnSwitch > 0) {
                $gameSwitches.setValue(CONFIG.roomCloseOnSwitch, true);
            }
            if (CONFIG.roomCloseCommonEvent > 0) {
                // Runs once the player has arrived back on the origin map
                // (reserved common events wait until the map is ready).
                $gameTemp.reserveCommonEvent(CONFIG.roomCloseCommonEvent);
            }
            $gameSystem.restoreRecollectionAudio();
            if ($gameSystem.hasRecollectionOrigin()) {
                // A playback happened: the map interpreter may still hold
                // the recollection event mid-execution. Kill it so it can't
                // resume on the origin map, and keep events suppressed
                // until the transfer completes.
                $gameMap._interpreter.clear();
                suppressMapEvents = true;
            }
            $gameSystem.restoreRecollectionOrigin();
            // Go to the map explicitly instead of popScene(): after a
            // playback the SceneManager stack may be empty, and popping an
            // empty stack makes MZ terminate the game.
            SceneManager.goto(Scene_Map);
        }

        onSelectEvent() {
            const item = this._gridWindow.currentItem();
            if (!isUnlocked(item)) {
                SoundManager.playBuzzer();
                this._gridWindow.activate();
                return;
            }
            SoundManager.playOk();
            lastPlayedSelection = {
                page: this._gridWindow.currentPage(),
                index: this._gridWindow.index()
            };
            $gameSystem.saveRecollectionOrigin();
            $gameSystem.setRecollectionActive(true);
            $gameSystem.setPendingRecollectionEvent(item.eventId, item.pageIndex);
            $gamePlayer.reserveTransfer(item.mapId, item.startX, item.startY, 2, 0);
            SceneManager.goto(Scene_Map);
        }

        update() {
            super.update();
            if (this._gridWindow && this._gridWindow.consumeSelectionChanged()) {
                this._updateFooterInfo();
                this._updateSelectionRing();
            }
        }
    }

    //-------------------------------------------------------------------------
    // Window_RecollectionGrid
    //-------------------------------------------------------------------------
    class Window_RecollectionGrid extends Window_Selectable {
        initialize(rect) {
            super.initialize(rect);
            this._page = 0;
            this._selectionChanged = false;
            this.opacity = 0;
            this.frameVisible = false;
            const size = Layout.calcThumbSize();
            this._thumbW = size.w;
            this._thumbH = size.h;
            const origin = Layout.calcGridOrigin(this._thumbW);
            this._gridOriginX = origin.x - rect.x;
            this._gridOriginY = 0;
            this.select(0);
            this.activate();
            this.refresh();
            // Hide default cursor - we draw our own gold ring in Scene
            if (this._cursorSprite) {
                this._cursorSprite.visible = false;
            }
        }

        maxCols() {
            return CONFIG.cols;
        }

        maxItems() {
            const start = this._page * CONFIG.itemsPerPage;
            return Math.min(CONFIG.itemsPerPage, CONFIG.recollections.length - start);
        }

        totalPages() {
            return Math.max(1, Math.ceil(CONFIG.recollections.length / CONFIG.itemsPerPage));
        }

        currentPage() {
            return this._page;
        }

        itemAt(index) {
            if (index < 0) return null;
            const globalIndex = this._page * CONFIG.itemsPerPage + index;
            return CONFIG.recollections[globalIndex] || null;
        }

        currentItem() {
            return this.itemAt(this.index());
        }

        consumeSelectionChanged() {
            const v = this._selectionChanged;
            this._selectionChanged = false;
            return v;
        }

        thumbRect(index) {
            // Returns absolute screen-space rect for the thumbnail at index
            const col = index % CONFIG.cols;
            const row = Math.floor(index / CONFIG.cols);
            const gap = Layout.gap;
            const x = this.x + this._gridOriginX + col * (this._thumbW + gap);
            const y = this.y + this._gridOriginY + row * (this._thumbH + gap);
            return new Rectangle(x, y, this._thumbW, this._thumbH);
        }

        itemRect(index) {
            // Called by Window_Selectable internals for cursor positioning
            const col = index % CONFIG.cols;
            const row = Math.floor(index / CONFIG.cols);
            const gap = Layout.gap;
            const x = this._gridOriginX + col * (this._thumbW + gap);
            const y = this._gridOriginY + row * (this._thumbH + gap);
            return new Rectangle(x, y, this._thumbW, this._thumbH);
        }

        itemHeight() {
            return this._thumbH;
        }

        colSpacing() {
            return Layout.gap;
        }

        rowSpacing() {
            return Layout.gap;
        }

        select(index) {
            const prev = this._index;
            super.select(index);
            if (prev !== index) {
                this._selectionChanged = true;
            }
        }

        setPageAndIndex(page, index) {
            const maxPage = Math.max(0, this.totalPages() - 1);
            this._page = Math.min(Math.max(page, 0), maxPage);
            this.refresh();
            const maxIdx = Math.max(0, this.maxItems() - 1);
            this.select(Math.min(Math.max(index, 0), maxIdx));
        }

        changePage(delta, selectLast) {
            const newPage = this._page + delta;
            if (newPage < 0 || newPage >= this.totalPages()) return false;
            this._page = newPage;
            const max = this.maxItems();
            this.select(selectLast ? Math.max(0, max - 1) : 0);
            this.refresh();
            SoundManager.playCursor();
            this.callHandler('pageChanged');
            return true;
        }

        cursorPagedown() {
            this.changePage(1, false);
        }

        cursorPageup() {
            this.changePage(-1, false);
        }

        cursorRight(wrap) {
            // On the last item of the page, right arrow advances to the
            // next page (selecting its first item).
            if (this.index() === this.maxItems() - 1 &&
                    this._page < this.totalPages() - 1) {
                this.changePage(1, false);
            } else {
                super.cursorRight(wrap);
            }
        }

        cursorLeft(wrap) {
            // On the first (top-left) item of page 2+, left arrow goes
            // back to the previous page (selecting its last item).
            if (this.index() === 0 && this._page > 0) {
                this.changePage(-1, true);
            } else {
                super.cursorLeft(wrap);
            }
        }

        isCurrentItemEnabled() {
            const item = this.currentItem();
            return isUnlocked(item);
        }

        drawItem(index) {
            // Intentionally empty: tile visuals (backgrounds, locked state,
            // thumbnails, overlays) are all rendered as scene sprites in
            // Scene_Recollection._refreshThumbLayer. Window contents are not
            // used for drawing in this plugin; the window only handles
            // input, selection and paging.
        }

    }

    //-------------------------------------------------------------------------
    // Expose classes globally (for extension/debugging)
    //-------------------------------------------------------------------------
    window.Scene_Recollection = Scene_Recollection;
    window.Window_RecollectionGrid = Window_RecollectionGrid;

})();
