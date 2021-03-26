// 初期表示用のデフォルト画像
const initialDisplayURL = 'img/initial-display.png';

// サンプルアルバム名
const sampleAlbumName = 'サンプルアルバム';

// 現在表示しているアルバム名
let currentAlbumName = null;

// 現在ログインしているユーザID
let currentUID;

// Firebaseから取得したデータを一時保存しておくための変数
let dbdata = {};

// 初回表示プラグ（通知メッセージを表示しない）
let initialDisplayFlg;

/**
 * --------------------
 * アルバム作成関連の関数
 * --------------------
 */
// アルバム作成モーダルの内容をリセットする
const resetCreateAlbumModal = () => {
  $('#create-album-form')[0].reset();
  $('#create-album__album-title').removeClass('has-error');
  $('#create-album__help').hide();
};

/**
 * --------------------
 * ユーザ設定関連の関数
 * --------------------
 */
// UserSettingsModalを初期状態に戻す
const resetUserSettingsModal = () => {
  $('#user-settings-form')[0].reset();
};

/**
 * -------------------
 * アルバム画面関連の関数
 * -------------------
 */
// 写真画像をダウンロードする
const downloadPhotoImage = photoImageLocation => firebase
  .storage()
  .ref(photoImageLocation)
  .getDownloadURL()
  .catch((error) => {
    console.error('写真のダウンロードに失敗:', error);
  });

// Realtime Database の photos から写真を削除する
const deletePhoto = (photoId) => {
  const confirm = window.confirm('削除しますか？');
  if (confirm) {
    firebase
      .database()
      .ref(`photos/${currentAlbumName}/${photoId}`)
      .remove();
  }
};

// ウィンドウサイズによって、表示方式を決定する
const switchWindow = () => {

  const windowWidth = window.innerWidth;
  if (windowWidth < 576) {
    $('#photo-list').attr('class', 'row justify-content-center');
    // $('#photo-list').attr('class', 'justify-content-center');
  } else {
    $('#photo-list').attr('class', 'row justify-content-start');
    // $('#photo-list').attr('class', 'justify-content-start');
  }
};

// photoの表示用のdiv（jQueryオブジェクト）を作って返す
const createPhotoDiv = (photoId, photo) => {
  // HTML内のテンプレートからコピーを作成
  let divTag = null;
  divTag = $('#photo-item').clone();
  
  // 写真画像をダウンロードして表示する
  downloadPhotoImage(photo.photoImageLocation).then((url) => {
    divTag.find('.photo-image').attr({
      src: url,
      alt: photo.comment,
    });
  });

  // id属性をセット
  divTag.attr('id', `photo-id-${photoId}`);

  // ツールチップをセット
  // ※何故か写真画像のダウンロード時に設定するとBootstrapが適用されないため分けて設定
  divTag.find('.photo-image').attr({
    'data-toggle': 'tooltip',
    'data-placement': 'top',
    title: 'By ' + dbdata.users[photo.createdByUID].nickname,
  });

  // 写真コメントを表示する
  divTag.find('#photo-comment').text(photo.comment);
  
  // 削除ボタンのイベントハンドラを登録
  const photoDelete = divTag.find('#photo-delete');
  photoDelete.on('click', () => {
    deletePhoto(photoId);
  });
  return divTag;
};
 
// photoを表示する
const addPhoto = (photoId, photo) => {
  const divTag = createPhotoDiv(photoId, photo);
  divTag.appendTo('#photo-list');
  
  // BootstrapのTooltipを適用
  $('[data-toggle="tooltip"]').tooltip();

  // 一番下までスクロール
  $('html, body').scrollTop($(document).height());
};

// 動的に追加されたアルバムを一旦削除する
const clearAlbumList = () => {
  $('#album-list')
    .find('.list-item')
    .remove();
};

// プルダウンリストのデフォルト表示を切り替える
const defaultSwitch = (albums) => {

  // アルバムの有無でデフォルト表記を変更する
  // if (albums) {
  //   $('#test').text('--- アルバムを選択 ---');
  //   $('#album-list').select2();
  // } else {
  //   $('#test').text('--- アルバム未登録 ---');
  //   $('#album-list').select2();
  // }
};

// アルバム画面の表示を切り替える
const displaySwitch = (currentAlbumName) => {

  if (currentAlbumName) {

    // 現在のアルバム名が選択されている場合、プルダウンリストに設定する
    $('#album-list option').attr('selected', false);
    $('#album-list').val(`${currentAlbumName}`);

    // アルバム削除マークを非表示にする
    $('#album-delete').css('display', 'block');
    
    // 写真投稿アイコンを非表示にする
    $('.photo-post-icon').css('display', 'block');
  } else {

    // アルバムの有無でデフォルト表記を変更する
    defaultSwitch(dbdata.albums);

    // 現在のアルバム名が未設定の場合、プルダウンリストをデフォルト表示にする
    $('#album-list option').attr('selected', false);
    $('#album-list').val('default');
    
    // アルバム削除マークを非表示にする
    $('#album-delete').css('display', 'none');
    
    // 写真投稿アイコンを非表示にする
    $('.photo-post-icon').css('display', 'none');
  }
};

// アルバム一覧をプルダウンリストに表示する
const showAlbumList = (albumsSnapshot) => {
  // 動的に追加されたアルバムを一旦削除する
  clearAlbumList();

  // オブジェクト⇒配列に変換する
  let albumsSnapshotKey = [];
  albumsSnapshot.forEach((albumSnapshot) => {
    albumsSnapshotKey.push(albumSnapshot.key);
  });

  // 新しく作成したアルバムから表示する
  // ※作成順に取得しているのでreverseで逆から処理する
  albumsSnapshotKey.reverse().forEach((albumSnapshotKey) => {

    const albumListOption = $('<option>', {
      class: 'list-item',
      value: `${albumSnapshotKey}`,
    }).text(albumSnapshotKey);

    // 新緑の京都を選択済にするため処理を分岐
    // let albumListOption = '';
    // if (albumSnapshotKey === '新緑の京都') {
    //   albumListOption = $('<option>', {
    //     class: 'list-item',
    //     value: `${albumSnapshotKey}`,
    //     defaultSelected: 'true',
    //   }).text(albumSnapshotKey);
    //   console.log('新緑の京都の分岐処理');
    // } else {
    //   albumListOption = $('<option>', {
    //     class: 'list-item',
    //     value: `${albumSnapshotKey}`,
    //   }).text(albumSnapshotKey);
    // }

    albumListOption.on('click', () => {
      // ハンバーガーメニューが開いている場合は閉じる
      $('#nav-bar').collapse('hide');
    });
    // アルバム選択リストに追加
    $('#album-list').append(albumListOption);
  });
  
  // アルバム画面の表示を切り替える
  displaySwitch(currentAlbumName);
};

// 表示されている写真を消去
const clearPhotos = () => {
  $('#photo-list').empty();
};

// アルバムビュー内の情報をクリア
const resetAlbumView = () => {
  // 写真一覧を消去
  clearPhotos();

  // プルダウンリストのアルバム一覧を消去
  clearAlbumList();
};

// 初期表示用画像を表示
const showInitialDisplay = () => {
  const $div = $('<div>', {
    class: 'initial-display',
  });

  $div.append(
    $('<img>', {
      src: initialDisplayURL,
      alt: '',
    }),
  );
  $div.appendTo('#photo-list');
};

// アルバムを実際に表示する
const showAlbum = (albumTitle) => {
  if (!dbdata.albums || !dbdata.albums[albumTitle]) {
    console.error('該当するアルバムがありません:', albumTitle);
    return;
  }
  // 現在のアルバム名を設定
  currentAlbumName = albumTitle;

  clearPhotos();

  // アルバムの写真一覧をダウンロードし、かつ写真の追加を監視
  const photosRef = firebase.database().ref(`photos/${albumTitle}`);

  // 初回表示フラグをON
  initialDisplayFlg = 'ON';

  // 過去に登録したイベントハンドラを削除
  photosRef.off('child_removed');
  photosRef.off('child_added');

  // photos の child_removedイベントハンドラを登録
  photosRef.on('child_removed', (childSnapshot) => {
    const photoId = childSnapshot.key;
    const targetPhoto = $(`#photo-id-${photoId}`);

    targetPhoto.remove();
  });

  // photos の child_addedイベントハンドラを登録
  photosRef.on('child_added', (childSnapshot) => {
    if (albumTitle === currentAlbumName) {
      // 追加された写真を表示
      addPhoto(childSnapshot.key, childSnapshot.val());
    }
    if (!initialDisplayFlg) {
      $('#submit-toast').toast('show');
    }
  });

  
  // アルバム画面の表示を切り替える
  displaySwitch(currentAlbumName);

  // ウィンドウ幅によって表示方式を変える
  switchWindow();
};

/**
 * アルバムを削除する
 * なおアルバムが削除されると photosRef.on('value', ...); のコールバックが実行され、ログイン直後の初期表示となる
 */
const deleteAlbum = (albumName) => {

  // 初期ルームは削除不可
  if (albumName === sampleAlbumName) {
    throw new Error(`${sampleAlbumName}ルームは削除できません`);
  }

  // 現在表示しているアルバム名をクリア
  currentAlbumName = null;

  // アルバムを削除
  firebase
    .database()
    .ref(`albums/${albumName}`)
    .remove();
    
  // アルバム内の写真も削除
  firebase
    .database()
    .ref(`photos/${albumName}`)
    .remove();
};

// アルバム画面の初期化処理
const loadAlbumView = () => {

  dbdata = {}; // キャッシュデータを空にする
  
  // ユーザ一覧を取得してさらに変更を監視
  const usersRef = firebase.database().ref('users');
  // 過去に登録したイベントハンドラを削除
  usersRef.off('value');
  // イベントハンドラを登録
  usersRef.on('value', (usersSnapshot) => {
    // usersに変更があるとこの中が実行される
    
    dbdata.users = usersSnapshot.val();

    // 自分のユーザデータが存在しない場合は作成
    if (dbdata.users === null || !dbdata.users[currentUID]) {
      const { currentUser } = firebase.auth();
      if (currentUser) {
        console.log('ユーザデータを作成します');
        firebase
          .database()
          .ref(`users/${currentUID}`)
          .set({
            nickname: currentUser.email,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
          });

        // このコールバック関数が再度呼ばれるのでこれ以上は処理しない
        return;
      }
    }
  });
  
  // アルバム一覧を取得してさらに変更を監視（作成順に取得）
  const albumsRef = firebase.database().ref('albums').orderByChild('createdAt');
  // 過去に登録したイベントハンドラを削除
  albumsRef.off('value');
  
  // コールバックを登録
  albumsRef.on('value', (albumsSnapshot) => {
    // albumsに変更があるとこの中が実行される
    
    dbdata.albums = albumsSnapshot.val();

    // アルバム一覧をプルダウンに表示
    showAlbumList(albumsSnapshot);

  });
  
  // // 初期表示用画像を表示
  // showInitialDisplay();

  // サンプルアルバムを表示（初回のみ）
  // ※データ取得の時間を考慮して1秒後に処理を実行
  setTimeout(() => {
    showAlbum(sampleAlbumName);
  }, 2000);
};

/**
 * --------------------
 * 写真投稿フォーム関連の関数
 * --------------------
 */
const photoPostDisplaySwitch = () => {
  $('.photo-post-icon').css('display', 'none');
  $('.close-icon').css('display', 'none');
  $('#photo-post-form').css('display', 'none');
};

/**
 * ----------------------
 * すべての画面共通で使う関数
 * ----------------------
 */
// ビュー（画面）を変更する
const showView = (id) => {
  $('.view').hide();
  $(`#${id}`).fadeIn();
  
  if (id === 'album') {
    loadAlbumView();
  }
};

/**
 * -------------------------
 * ログイン・ログアウト関連の関数
 * -------------------------
 */
// ログインフォームを初期状態に戻す
const resetLoginForm = () => {
  $('#login-form > .form-group').removeClass('has-error');
  $('#login__help').hide();
  $('#login__submit-button')
    .prop('disabled', false)
    .text('ログイン');
};

// ログインした直後に呼ばれる
const onLogin = () => {
  console.log('ログイン完了');
  
  // アルバム画面を表示
  showView('album');
};

// ログアウトした直後に呼ばれる
const onLogout = () => {
  firebase
    .database()
    .ref('users')
    .off('value');
  firebase
    .database()
    .ref('albums')
    .off('value');
  dbdata = {};
  resetLoginForm();
  resetAlbumView();
  resetUserSettingsModal();
  currentAlbumName = null;
  displaySwitch(currentAlbumName);
  photoPostDisplaySwitch();
  showView('login');
};

// ユーザ作成のときパスワードが弱すぎる場合に呼ばれる
const onWeakPassword = () => {
  resetLoginForm();
  $('#login__password').addClass('has-error');
  $('#login__help')
    .text('6文字以上のパスワードを入力してください')
    .fadeIn();
};

// ログインのときパスワードが間違っている場合に呼ばれる
const onWrongPassword = () => {
  resetLoginForm();
  $('#login__password').addClass('has-error');
  $('#login__help')
    .text('正しいパスワードを入力してください')
    .fadeIn();
};

// ログインのとき試行回数が多すぎてブロックされている場合に呼ばれる
const onTooManyRequests = () => {
  resetLoginForm();
  $('#login__submit-button').prop('disabled', true);
  $('#login__help')
    .text('試行回数が多すぎます。後ほどお試しください。')
    .fadeIn();
};

// ログインのときメールアドレスの形式が正しくない場合に呼ばれる
const onInvalidEmail = () => {
  resetLoginForm();
  $('#login__email').addClass('has-error');
  $('#login__help')
    .text('メールアドレスを正しく入力してください')
    .fadeIn();
};

// その他のログインエラーの場合に呼ばれる
const onOtherLoginError = () => {
  resetLoginForm();
  $('#login__help')
    .text('ログインに失敗しました')
    .fadeIn();
};

/**
 * ---------------------------------------
 * 以下、コールバックやイベントハンドラの登録と、
 * ページ読み込みが完了したタイミングで行うDOM操作
 * ---------------------------------------
 */

/**
 * --------------------
 * ログイン・ログアウト関連
 * --------------------
 */
// ユーザ作成に失敗したことをユーザに通知する
const catchErrorOnCreateUser = (error) => {
  // 作成失敗
  console.error('ユーザ作成に失敗:', error);
  if (error.code === 'auth/weak-password') {
    onWeakPassword();
  } else {
    // その他のエラー
    onOtherLoginError(error);
  }
};

// ログインに失敗したことをユーザに通知する
const catchErrorOnSignIn = (error) => {
  if (error.code === 'auth/wrong-password') {
    // パスワードの間違い
    onWrongPassword();
  } else if (error.code === 'auth/too-many-requests') {
    // 施行回数多すぎてブロック中
    onTooManyRequests();
  } else if (error.code === 'auth/invalid-email') {
    // メールアドレスの形式がおかしい
    onInvalidEmail();
  } else {
    // その他のエラー
    onOtherLoginError(error);
  }
};

// ログイン状態の変化を監視する
firebase.auth().onAuthStateChanged((user) => {
  // ログイン状態が変化した
  
  if (user) {
    // ログイン済
    currentUID = user.uid;
    onLogin();
  } else {
    // 未ログイン
    currentUID = null;
    onLogout();
  }
});

// ログインフォームが送信されたらログインする
$('#login-form').on('submit', (e) => {
  e.preventDefault();
  
  // フォームを初期状態に戻す
  resetLoginForm();
  
  // ログインボタンを押せないようにする
  $('#login__submit-button')
    .prop('disabled', true)
    .text('送信中…');
    
  const email = $('#login-email').val();
  const password = $('#login-password').val();
  
  /**
   * ログインを試みる
   * ※ログインを試みて該当ユーザが存在しない場合は新規作成する（開発時のみコメントアウト）
   */
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .catch((error) => {
      console.log('ログイン失敗:', error);
      // if (error.code === 'auth/user-not-found') {
      //   // 該当ユーザが存在しない場合は新規作成する
      //   firebase
      //     .auth()
      //     .createUserWithEmailAndPassword(email, password)
      //     .then(() => {
      //       // 作成成功
      //       console.log('ユーザを作成しました');
      //     })
      //     .catch(catchErrorOnCreateUser);
      // } else {
      //   catchErrorOnSignIn(error);
      // }
      catchErrorOnSignIn(error);
    });
});

// ログアウトがクリックされたらログアウトする
$('#logout').on('click', (e) => {
  e.preventDefault();
  
  // ハンバーガーメニューが開いている場合は閉じる
  $('#nav-bar').collapse('hide');
  
  firebase
    .auth()
    .signOut()
    .then(() => {
      // ログアウト成功
      window.location.hash = '';
    })
    .catch((error) => {
      console.log('ログアウトに失敗:', error);
    });
});

/**
 * -------------------------
 * アルバム画面関連の関数
 * -------------------------
 */
// アルバム選択リストにselect2を適用する
// $(document).ready(function() {
//   $('#album-list').select2();
// });

// アルバム選択リストで指定されたアルバムを表示する
$('#album-list').change(() => {
  let selectItem = $('#album-list option:selected').val();

  // アルバムを表示
  showAlbum(selectItem);
});

// ウィンドウ幅によって表示方式を変える
$(window).resize(switchWindow);

/**
 * ------------
 * アルバム作成関連
 * ------------
 */
$('#create-album-modal').on('show.bs.modal', () => {
  // #create-album-modalが表示される直前に実行する処理
  
  // モーダルの内容をリセット
  resetCreateAlbumModal();
});

$('#create-album-modal').on('shown.bs.modal', () => {
  // #create-album-modalが表示された直後に実行する処理
  
  // ハンバーガーメニューが開いている場合は閉じる
  $('#nav-bar').collapse('hide');
  
  // アルバム名の欄にすぐ入力できる状態にする
  $('#album-title').trigger('focus');

});

$('#create-album-modal').on('submit', (e) => {
  const albumTitle = $('#album-title')
    .val()
    .trim(); // 頭とお尻の空白文字を除去
  $('#album-title').val(albumTitle);

  e.preventDefault();
  
  // Firebaseのキーとして使えない文字が含まれているかチェック
  if (/[.$#[\]/]/.test(albumTitle)) {
    $('#create-album__help')
      .text('アルバムタイトルに次の文字は使えません: . $ # [ ] /')
      .fadeIn();
    $('#create-album__album-title').addClass('has-error');
    return;
  }

  if (albumTitle.length < 1 || albumTitle.length > 20) {
    $('#create-album__help')
      .text('1文字以上20文字以内で入力してください')
      .fadeIn();
    $('#create-album__album-title').addClass('has-error');
    return;
  }

  if (dbdata.albums !== null && dbdata.albums[albumTitle]) {
    $('#create-album__help')
      .text('同じ名前のアルバムタイトルがすでに存在します')
      .fadeIn();
    $('#create-album__album-title').addClass('has-error');
    return;
  }

  // 現在のアルバム名を設定する
  // ※アルバム作成成功後に設定すると後のプルダウンリスト設定処理が正しく動かないため、作成前に設定
  currentAlbumName = albumTitle;

  /**
   * アルバム作成処理
   */
  firebase
    .database()
    .ref(`albums/${albumTitle}`)
    .set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      createdByUID: currentUID,
    })
    .then(() => {
      // アルバム作成に成功した場合は、下記2つの処理を実行する
      
      // モーダルを非表示にする
      $('#create-album-modal').modal('toggle');
      
      // 作成したアルバムを表示
      showAlbum(albumTitle);
      
      // 登録に応じてプルダウンリストのデフォルト表示を切り替える
      defaultSwitch(dbdata.albums);
    })
    .catch((error) => {
      console.error('アルバム作成に失敗:', error);
    });
});

/**
 * ---------------
 * ユーザ設定関連
 * ---------------
 */
$('#user-settings-modal').on('show.bs.modal', (e) => {
  // #user-settings-modalが表示される直前に実行する処理
  
  if (!dbdata.users) {
    e.preventDefault();
  }
  
  // ハンバーガーアルバムメニューが開いているときは閉じる
  $('#nav-bar').collapse('hide');
  
  // ニックネームの欄に現在の値を入れる
  $('#user-name').val(dbdata.users[currentUID].nickname);
});

$('#user-settings-modal').on('submit', (e) => {
  const userName = $('#user-name').val();
  if (userName.length === 0) {
    // 入力されていない場合は何もしない
    return;
  }
  
  e.preventDefault();
  
  firebase
    .database()
    .ref(`users/${currentUID}`)
    .update({
      nickname: userName,
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
    })
    .then(() => {
      // ユーザ設定に成功した場合は、下記処理を実行する
      
      // モーダルを非表示にする
      $('#user-settings-modal').modal('toggle');
      
    })
    .catch((error) => {
      console.error('ユーザ設定に失敗:', error);
    });
});

/**
 * ------------
 * アルバム削除関連
 * ------------
 */
$('#delete-album-modal').on('show.bs.modal', (e) => {
  // アルバム削除のモーダル表示前に実行する処理
  
  if (!currentAlbumName) {
    e.preventDefault();
  }
  
  // モーダルの内容をリセット
  $('#delete-album__title').text('『' + currentAlbumName + '』');
  
  // ハンバーガーメニューが開いている場合は閉じる
  $('#nav-bar').collapse('hide');
});

// アルバム削除ボタンクリックでアルバムを削除する
$('#delete-album__button').on('click', () => {
  deleteAlbum(currentAlbumName);
  $('#delete-album-modal').modal('toggle');
  
  // 削除に応じてプルダウンリストのデフォルト表示を切り替える
  defaultSwitch(dbdata.albums);
  // 初期表示用画像を表示
  showInitialDisplay();
});

/**
 * -------------------------
 * 写真投稿フォーム関連の関数
 * -------------------------
 */
const $photoPostForm = $('#photo-post-form');

// 写真投稿フォームを表示させる
$('.photo-post-icon').on('click', () => {
  $photoPostForm.slideDown();
  
  // 写真投稿フォームのコメント欄にニックネームを表示する
  $('#comment-form__text').attr('placeholder', 'Comment by ' + dbdata.users[currentUID].nickname);
});

// 写真投稿フォームを隠す
$('.close-icon').on('click', () => {
  $photoPostForm.slideUp();
});

// 写真投稿フォームのアイコン切り替え
$('.toggle').on('click', function () {
  $('.close-icon').toggle();
  $('.photo-post-icon').toggle();
});

let file = null; // 選択ファイルが格納される変数
let blob = null; // 画像(BLOBデータ)
const THUMBNAIL_WIDTH = 500; // 画像リサイズ後の横の長さの最大値
const THUMBNAIL_HEIGHT = 500; // 画像リサイズ後の縦の長さの最大値

// 写真投稿フォームで指定された写真をプレビュー表示する
$('#photo-select__form').on('change', (e) => {
  
  file = e.target.files[0];

  let reader = new FileReader();
  let image = new Image();
  reader.onload = function (e) {
    image.src = reader.result;
    image.onload = function() {

      // 縮小後のサイズを計算する
      let width, height;
      if (image.width > image.height) {
        // 横長の画像は横のサイズを指定値に合わせる
        let ratio = image.height / image.width;
        width = THUMBNAIL_WIDTH;
        height = THUMBNAIL_WIDTH * ratio;
      } else {
        // 縦長の画像は縦のサイズを指定値に合わせる
        let ratio = image.width/image.height;
        width = THUMBNAIL_HEIGHT * ratio;
        height = THUMBNAIL_HEIGHT;
      }
      // Storageへ保存する画像サイズを上で算出した値に変更
      let canvas = $('#canvas')
        .attr('width', width)
        .attr('height', height);
      const ctx = canvas[0].getContext('2d');
      // canvasに既に描画されている画像があればそれを消す
      ctx.clearRect(0,0,width,height);
      // canvasに縮小画像を描画する
      ctx.drawImage(image,
        0,0,image.width,image.height,
        0,0,width,height
      );
      // canvasからbase64画像データを取得
      let base64 = canvas.get(0).toDataURL('image/jpeg');        
      // base64からBlobデータを作成
      let barr, bin, i, len;
      bin = atob(base64.split('base64,')[1]);
      len = bin.length;
      barr = new Uint8Array(len);
      i = 0;
      while (i < len) {
        barr[i] = bin.charCodeAt(i);
        i++;
      }
      blob = new Blob([barr], {type: 'image/jpeg'});
    };
    $("#preview").attr('src', e.target.result);
  };
  reader.readAsDataURL(file);

  // 写真選択ボタンを隠し、写真プレビューを表示
  $('.photo-select').css('display', 'none');
  $('.photo-preview').css('display', 'block');
});

// プレビューの閉じるマークがクリックされた時
$('#close-preview').on('click', () => {
  // 写真プレビューを閉じ、写真選択ボタンを表示
  $('.photo-preview').css('display', 'none');
  $('.photo-select').css('display', 'block');
});

// 写真を投稿する
$('#photo-post-form').on('submit', (e) => {

  // 初回表示フラグをクリア
  initialDisplayFlg = '';

  // 通知メッセージの文言を設定
  $('.toast-body').text(dbdata.users[currentUID].nickname + ' が写真を投稿しました。');

  // 写真を取得
  const photoSelectForm = $('#photo-select__form');
  const { files } = photoSelectForm[0];

  // コメントを取得
  const commentForm = $('#comment-form__text');
  const comment = commentForm.val();
  
  e.preventDefault();
  
  if (files.length === 0 || comment === '') {
    return;
  }
  commentForm.val('');
  
  const file = files[0];
  const filename = file.name;
  const photoImageLocation = `photo-images/${filename}`;

  // 写真データを投稿する
  firebase
    .storage()
    .ref(photoImageLocation)
    .put(blob)
    .then(() => {
      // Storageへのアップロードに成功したら、Realtime Databaseに写真データとコメントを保存する
      const photoComment = {
        comment,
        photoImageLocation,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        createdByUID: currentUID
      };
      return firebase
        .database()
        .ref(`photos/${currentAlbumName}`)
        .push(photoComment);
    })
    .catch((error) => {
      // 失敗したとき
      console.error('エラー', error);
    });

  // 写真プレビューを閉じ、写真選択ボタンを表示
  $('.photo-select').css('display', 'block');
  $('.photo-preview').css('display', 'none');
});
