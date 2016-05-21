require('./questPage.styl');
/* eslint-disable no-unused-expressions*/
'use strict';
var latitude;
var longitude;
var slug = document.getElementById('questName').getAttribute('data-slug');

$(document).ready(function () {
    $('.emoji-wysiwyg-editor').css('height', '43px');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        });
    } else {
        $("input[id$='_my-file-selector']").attr("disabled", true);
    }
});

var addPhotoBtn = document.getElementsByClassName('extraBtn');
[].slice.call(addPhotoBtn).forEach(btn => {
    btn.addEventListener('click', function () {
        var id = this.id.split('_')[0];
        showForm(id);
    });
});

$(function () {
    $("input[id$='_my-file-selector']").change(function () {
        uploadFile(this.id.slice(0, -17), '_my-file-selector');
    });
});

function uploadFile(idPhoto, selector) {
    loadBase64($('#' + idPhoto + selector)[0].files[0], function (res) {
        var data = {
            fileToUpload: res,
            id: idPhoto,
            latitude: latitude,
            longitude: longitude,
            slug: slug
        };

        $.ajax({
            url: "/sendUserPhoto",
            type: "POST",
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function (response) {
                if (response.isOk) {
                    // console.log(idPhoto);
                    var img = document.getElementById(idPhoto + '_photoImg');
                    var hint = document.getElementById(idPhoto + '_photoHint');
                    var label = document.getElementById(idPhoto + '_photoLabel');
                    $("#" + idPhoto + "_my-file-selector").attr("disabled", true);
                    img.style.opacity = '.4';
                    hint.style.opacity = '.4';
                    label.setAttribute('disabled', true);
                    label.textContent = 'Фотография принята';
                    $("#" + idPhoto + "_extraPhoto").attr("disabled", true);
                }
                /* eslint-disable no-undef*/
                bootbox.alert(response.message, function () {});
            },
            error: function (jqXHR, textStatus, errorMessage) {
                console.log(errorMessage);
            }
        });
    });
}

function loadBase64(photo, callback) {
    const reader = new FileReader();
    reader.addEventListener('load', function () {
        const base64 = reader.result.replace(/(\r\n|\n|\r)/gm, '');
        callback(base64);
    });
    reader.readAsDataURL(photo);
}

var questCommentsBox = document.getElementById('questCommentsBox');

var likeBtn = document.getElementById('likes');
var dislikeBtn = document.getElementById('dislikes');
var likesCount = document.getElementById('likesCount');
var dislikesCount = document.getElementById('dislikesCount');
var callback = function (data) {
    if (data.rating) {
        likesCount.textContent = data.rating.likes.length;
        dislikesCount.textContent = data.rating.dislikes.length;
        likeBtn.classList.toggle('isChecked');
        dislikeBtn.classList.toggle('isChecked');
    }
};

likeBtn.addEventListener('click', function () {
    likeRequest('like', callback);
});

dislikeBtn.addEventListener('click', function () {
    likeRequest('dislike', callback);
});

function likeRequest(action, callback) {
    $.ajax({
        url: '/likeQuest',
        dataType: 'json',
        type: 'PUT',
        data: {slug, action},
        success: function (result) {
            callback(result);
        },
        error: function (xhr, status, err) {
            console.error(err);
        }
    });
}

var questBtn = document.getElementById('wish');
if (questBtn) {
    questBtn.addEventListener('click', function () {
        if ($(questBtn).text().trim() === 'Редактировать') {
            window.location.pathname = '/quest/' + slug + '/edit';
        } else {
            addToWishList(slug);
        }
    });
}

var addPhotoCommentBtn = document.getElementsByClassName('addComment');
[].slice.call(addPhotoCommentBtn).forEach(btn => {
    btn.addEventListener('click', function () {
        var btnId = btn.id.slice(19);
        addPhotoComment(document.getElementById('addPhotoComment-' + btnId));
    });
});

var addQuestCommentBtn = document.getElementById('addQuestComment');
if (addQuestCommentBtn) {
    addQuestCommentBtn.addEventListener('click', function () {
        addQuestComment(document.getElementById('testCommentQuest'));
    });
}

function addPhotoComment(commentInfo) {
    var data = {
        slug: slug,
        url: commentInfo.getAttribute('data-url'),
        commentUrl: commentInfo.getAttribute('data-mc'),
        text: commentInfo.value
    };
    $.ajax({
        url: '/addPhotoComment',
        dataType: 'json',
        type: 'PUT',
        data: data,
        success: function (result) {
            var id = "cb_" + data.commentUrl;
            var commentsBox = document.getElementById(id);
            commentsBox.appendChild(createPhotoComment(result));
            commentInfo.value = '';
        },
        error: function (xhr, status, err) {
            console.error(err);
        }
    });
}

function addQuestComment(commentText) {
    var data = {
        slug: slug,
        text: commentText.value
    };
    $.ajax({
        url: '/addQuestComment',
        dataType: 'json',
        type: 'PUT',
        data: data,
        success: function (result) {
            questCommentsBox.appendChild(createQuestComment(result));
            commentText.value = '';
            var noCom = document.getElementById('noComments');
            if (noCom) {
                noCom.style.display = 'none';
            }
            var commentsCount = document.getElementById('commentsCount');
            commentsCount.textContent = parseInt(commentsCount.textContent, 10) + 1;
        },
        error: function (xhr, status, err) {
            console.error(err);
        }
    });
}

function createPhotoComment(data) {
    var authorPhoto = document.createElement('div');
    authorPhoto.classList.add('author-photo');
    var img = document.createElement('img');
    img.setAttribute('src', data.authorPhoto);
    authorPhoto.appendChild(img);

    var commentText = document.createElement('div');
    commentText.classList.add('comment-text');

    var name = document.createElement('p');
    name.classList.add('author-name');
    name.textContent = data.author;
    commentText.appendChild(name);

    var text = document.createElement('p');
    text.classList.add('text');
    text.textContent = data.body;
    commentText.appendChild(text);

    var date = document.createElement('p');
    date.classList.add('date');
    date.textContent = data.date;
    commentText.appendChild(date);

    var commentBox = document.createElement('div');
    commentBox.classList.add('commentBox');
    commentBox.appendChild(authorPhoto);
    commentBox.appendChild(commentText);
    return commentBox;
}

function createQuestComment(data) {
    var questComment = document.createElement('div');
    questComment.classList.add('questComment');

    var commentAuthorPhoto = document.createElement('div');
    commentAuthorPhoto.classList.add('commentAuthorPhoto');

    var img = document.createElement('img');
    img.setAttribute('src', data.authorPhoto);
    commentAuthorPhoto.appendChild(img);

    var commentData = document.createElement('div');
    commentData.classList.add('commentData');

    var commentAuthor = document.createElement('p');
    commentAuthor.classList.add('commentAuthor');
    commentAuthor.textContent = data.author;

    var commentContent = document.createElement('p');
    commentContent.classList.add('commentContent');
    commentContent.textContent = data.body;

    var commentDate = document.createElement('p');
    commentDate.classList.add('commentDate');
    commentDate.textContent = data.date;

    commentData.appendChild(commentAuthor);
    commentData.appendChild(commentContent);
    commentData.appendChild(commentDate);
    questComment.appendChild(commentAuthorPhoto);
    questComment.appendChild(commentData);
    return questComment;
}

function addToWishList(slug) {
    $.ajax({
        url: '/addToWishList',
        dataType: 'json',
        type: 'POST',
        data: {slug: slug},
        success: function (result) {
            wishBtn.textContent = result.phrase;
            if (wishBtn.classList.contains('btn-success')) {
                wishBtn.classList.remove('btn-success');
                wishBtn.classList.add('btn-danger');
            } else {
                wishBtn.classList.remove('btn-danger');
                wishBtn.classList.add('btn-success');
            }
        },
        error: function (xhr, status, err) {
            console.error(err);
        }
    });
}

var isChoosen = false;

function showForm(id) {
    bootbox.dialog({
        title: "Вы нашли место на фото?",
        message: '<p>Укажите ваше местоположение:</p>' +
                '<div id="' + id + '_extraMap" class="map"></div>' +
                '<label class="btn btn-success extraLabel" id="' + id + '_file" for="' +
                id + '-fileInput">' +
                '<input id="' + id + '-fileInput" type="file" accept="image/*" capture="camera"' +
                ' data-bfi-disabled style="display:none;">' +
                'Отправить фото',
        buttons: {
            success: {
                label: 'Готово!',
                className: "btn-success",
                callback: function () {
                    if (latitude && longitude && isChoosen) {
                        uploadFile(id, '-fileInput');
                    } else {
                        return false;
                    }
                }
            }
        }
    });
    document.getElementById(id + '-fileInput').onchange = function () {
        isChoosen = true;
    };
    /* eslint-disable no-undef*/
    ymaps.ready(init);
    function init() {
        var placemark;
        var map = new ymaps.Map(id + '_extraMap', {
            center: [56.8575, 60.6125],
            zoom: 4,
            controls: ['zoomControl', 'fullscreenControl']
        });
        var search = new ymaps.control.SearchControl({options: {noPlacemark: true}});
        map.controls.add(search);
        map.events.add('click', function (event) {
            var coords = event.get('coords');
            if (placemark) {
                placemark.geometry.setCoordinates(coords);
            } else {
                placemark = new ymaps.Placemark(coords, {}, {draggable: true});
                map.geoObjects.add(placemark);
                placemark.events.add('dragend', function () {
                    setCoordinates(id, placemark.geometry.getCoordinates());
                });
            }
            setCoordinates(id, coords);
        });
    }
}

function setCoordinates(id, coords) {
    latitude = coords[0];
    longitude = coords[1];
}
