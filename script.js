// utils
function getCookie(name) {
    let value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value ? value[2] : null;
};

function request(url, header) {
    httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', url, false);
    if (header) httpRequest.setRequestHeader(Object.keys(header)[0], Object.values(header)[0]);
    httpRequest.send(null);
    
    if (httpRequest.status === 200) {
        return httpRequest.responseText;
    };
}
async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

// DOMLoaded
document.addEventListener('DOMContentLoaded', () => {
    getToken();
});

// getToken
async function getToken(){
    let tab = await getCurrentTab();
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: getCookie,
        args: ["xn_api_token"],
    }, function (response) {
        if (!response) {
            closeLoading();
            openError();
            showFbtn();
            return;
        }
        if (response[0].result) getLearnStatus();
        else {
            let res = request('https://canvas.skku.edu/api/v1/courses');
            let result = JSON.parse(res.split('while(1);')[1]);
            if (result[0]) {
                let index = 0;
                while (!Object.keys(result[index]).includes('name')) index += 1;
                chrome.tabs.create({url: `https://canvas.skku.edu/courses/${result[index].id}/external_tools/5`, active: false}, (tab) => {
                    var timerID = setInterval(function(){
                        chrome.scripting.executeScript({
                            target: {tabId: tab.id},
                            func: getCookie,
                            args: ["xn_api_token"],
                        }, function (response) {
                            if(response[0].result){
                                chrome.tabs.remove(tab.id);
                                getLearnStatus();
                                clearInterval(timerID);
                            }});
                    }, 2000);
                });
            }
        }
    });
}

async function getLearnStatus(){
    let tab = await getCurrentTab();
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ["executescript.js"],
    }, function (response) {
        if (response[0].result){
            let todo = sort(response[0].result);

            todo.lecture.forEach((lecture, index) => {
                if (!index) addTitle('강의', '.lecture');
                addLecture(lecture, '.lecture');
            });
            todo.assignment.forEach((lecture, index) => {
                if (!index) addTitle('과제', '.assignment');
                addLecture(lecture, '.assignment');
            });
            closeLoading();
            showFbtn();
        }
        else document.querySelector(".assignment").innerText = "데이터를 불러오는데 실패했습니다. 새로고침 후 재실행 해주세요";
    });
}

function dateToLocaleString(date){
    let newdate = new Date(date);
    return `${(newdate.getMonth()+1)}월 ${(newdate.getDate())}일(${day(newdate)}) ${newdate.toLocaleTimeString().substring(0, newdate.toLocaleTimeString().length - 3)}`;
}

function msToTime(time_ms){
    let time = '';
    let minutes = parseInt((time_ms/(1000*60))%60);
    let hours = parseInt((time_ms/(1000*60*60))%24);
    let days = parseInt(time_ms/(1000*60*60*24));

    time = (days > 0) ? days + '일' : (hours > 0) ? hours + '시간' : (minutes > 0) ? minutes + '분' : '';
    return time;
}

function day(date){
    let week = ['일', '월', '화', '수', '목', '금', '토'];
    return week[date.getDay()];
}

function sort(todo){
    todo.lecture.sort((a, b) => {
        return a["remainingTime_ms"]-b["remainingTime_ms"];
    });
    todo.assignment.sort((a, b) => {
        return a["remainingTime_ms"]-b["remainingTime_ms"];
    });
    return todo
}

function addLecture(lecture, type) {
    const div = document.querySelector(type);
    div.innerHTML += `<a class="lecture-btn" href="${lecture.url}" target="_blank"><div class="xnsl-components-container"><div class="xn-component-item-container learn open attendance"><div class="xn-component-item learn default movie open" tabindex="0" role="button"><div class="xnci-description-component-type-icon-container learn unpublished start movie"><div class="xnci-description-component-type-icon learn unpublished start movie"></div></div><div class="xnci-description movie"><div class="xnci-component-description-row first"><div class="xnci-component-description-row-left"><span class="xnci-component-title">${lecture.title}</span></div><div class="xnci-component-description-row-right"><span class="xnci-attendance-status none">남은 시간: ${msToTime(lecture.remainingTime_ms)}</span></div></div><div class="xnci-component-description-row second"><div class="xnci-component-description-row-left"><span><span class="xnci-description-component-type-container  learn unpublished start"><span class="xnci-description-component-type learn unpublished start">${lecture.course}</span></span></span></div><div class="xnci-component-description-row-right"><span><span class="xnci-date-container"><span class="xnci-info top-key"><!-- react-text: 124 -->마감일<!-- /react-text --><!-- react-text: 125 -->:<!-- /react-text --></span><span class="xnci-info top-value">${dateToLocaleString(lecture.due)}</span></span></span></div></div></div></div></div></div></a>`;
}

function addTitle(title, type) {
    const div = document.querySelector(type);
    const h2 = document.createElement('h2');
    h2.style = 'font-size: 16px; border-bottom: 1px solid #C7CDD1; padding-bottom: 6px; margin: 0 0 6px; font-weight: bold;';
    h2.innerText = title;
    div.appendChild(h2);
}

function closeLoading() {
    document.querySelector('#loading').style = 'display: none';
}

function openError() {
    document.querySelector('.error').style = 'display: block';
}

function showFbtn() {
    document.querySelector('.fbtn').style = 'display: block';
}

function openForm() {
    document.querySelector('#todoform').style = 'display: block';
    document.querySelector('#main').style = 'display: none';
}

function closeForm() {
    document.querySelector('#todoform').style = 'display: none';
    document.querySelector('#main').style = 'display: block';
}

function initForm() {
    document.querySelector('#todoname').value = '';
    document.querySelector('#todotype').value = '';
    document.querySelector('#tododate').value = '';
}

document.querySelector('#open-form-btn').addEventListener('click', () => {
    openForm();
});

document.querySelector('#close-form-btn').addEventListener('click', () => {
    initForm();
    closeForm();
});

document.querySelector('#add-btn').addEventListener('click', () => {
    if (document.querySelector('#todoname').value === '' || document.querySelector('#todotype').value === '') {
        alert('빈칸을 모두 채워주세요.');
    } else {
        alert('아직 구현되지 않은 기능입니다.');
        initForm();
        closeForm();
    }
});
