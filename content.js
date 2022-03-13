var authorizationToken = "Bearer " + getCookie("xn_api_token");
var uid = null, sid = null;

var courses = [];

var todo = {
    lecture: [],
    assignment: [],
};

function getCookie(name) {
    let value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value ? value[2] : null;
};

function gapTime(date){
    return new Date(date).getTime() - new Date().getTime();
}

function request(url, header) {
    httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', url, false);
    if (header) httpRequest.setRequestHeader(Object.keys(header)[0], Object.values(header)[0]);
    httpRequest.send(null);
    
    if (httpRequest.status === 200) {
        return httpRequest.responseText;
    };
}

function getCourses() {
    console.log("getCourses");
    let response = request('https://canvas.skku.edu/api/v1/users/self/favorites/courses', null);
    let result = JSON.parse(response.split('while(1);')[1]);
    result.forEach((item) => {
        let data = {
            'name': item.name,
            'id': item.id,
        }
        if (!uid) uid = item.enrollments[0].user_id;
        courses.push(data);
    });
}

function getSID() {
    console.log("getSID");
    let response = request(`https://canvas.skku.edu/learningx/api/v1/courses/${courses[0].id}/total_learnstatus/users/${uid}`, {
        'Authorization': authorizationToken
    });
    let result = JSON.parse(response);
    sid = result.item.user_login;
}

function getLecture() {
    console.log("getLecture");
    courses.forEach((course) => {
        let url = `https://canvas.skku.edu/learningx/api/v1/courses/${course.id}/allcomponents_db?user_id=${uid}&user_login=${sid}&role=1`;
        let response = request(url, { 'Authorization': authorizationToken });
        if (response.length > 0) {
            let data = JSON.parse(response);
            data.forEach((item) => {
                let remainTime = gapTime(item.due_at);
                if (remainTime > 0 && gapTime(item.unlock_at) < 0) {
                    if (item.use_attendance && item.attendance_status !== 'attendance') {
                        todo.lecture.push({
                            'course': course.name,
                            'title': item.title,
                            'remainingTime_ms': remainTime,
                            'due': item.due_at,               
                            'url': item.view_info.view_url
                        });
                    }
                    if (item.type == 'assignment' && !item.completed) {
                        todo.assignment.push({
                            'course': course.name,
                            'title': item.title,
                            'remainingTime_ms': remainTime,
                            'due': item.due_at,               
                            'url': item.view_info.view_url
                        });
                    }
                }
            });
        }
    });
    todo = sort(todo);
}

function addElement() {
    const dashboard = document.querySelector('.ic-DashboardCard__box').parentNode;

    const div = document.createElement('div');
    div.classList.add('lecture');
    const div2 = document.createElement('div');
    div2.classList.add('assignment');

    dashboard.appendChild(div);
    dashboard.appendChild(div2);
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
    div.innerHTML += `<a style="color: black;" href="${lecture.url}"><div class="xnsl-components-container"><div class="xn-component-item-container learn open attendance"><div class="xn-component-item learn default movie open" tabindex="0" role="button"><div class="xnci-description-component-type-icon-container learn unpublished start movie"><div class="xnci-description-component-type-icon learn unpublished start movie"></div></div><div class="xnci-description movie"><div class="xnci-component-description-row first"><div class="xnci-component-description-row-left"><span class="xnci-component-title">${lecture.title}</span></div><div class="xnci-component-description-row-right"><span class="xnci-attendance-status none">남은 시간: ${msToTime(lecture.remainingTime_ms)}</span></div></div><div class="xnci-component-description-row second"><div class="xnci-component-description-row-left"><span><span class="xnci-description-component-type-container  learn unpublished start"><span class="xnci-description-component-type learn unpublished start">${lecture.course}</span></span></span></div><div class="xnci-component-description-row-right"><span><span class="xnci-date-container"><span class="xnci-info top-key"><!-- react-text: 124 -->마감일<!-- /react-text --><!-- react-text: 125 -->:<!-- /react-text --></span><span class="xnci-info top-value">${dateToLocaleString(lecture.due)}</span></span></span></div></div></div></div></div></div></a>`;
}

function addTitle(title, type) {
    const div = document.querySelector(type);
    const h2 = document.createElement('h2');
    h2.style = 'font-size: 16px; border-bottom: 1px solid #C7CDD1; padding-bottom: 6px; margin: 0 0 6px; font-weight: bold;';
    h2.innerText = title;
    div.appendChild(h2);
}

function handler() {
    getCourses();
    getSID();
    getLecture();
    addElement();
    
    todo.lecture.forEach((lecture, index) => {
        if (!index) addTitle('강의', '.lecture');
        addLecture(lecture, '.lecture');
    });
    todo.assignment.forEach((lecture) => {
        if (!index) addTitle('과제', '.assignment');
        addLecture(lecture, '.assignment');
    });

    console.log("done");
}

// main

window.onload = () => {
    if (!getCookie('xn_api_token')) {
        chrome.storage.local.get([ 'isCookie' ], (result) => {
            if (!result.isOpen) {
                let response = request('https://canvas.skku.edu/api/v1/courses');
                let data = JSON.parse(response.split('while(1);')[1]);
                chrome.runtime.sendMessage({ action: 'OPEN_TOKEN_TAB', data }, (response) => {
                    const tabId = response.tab.id;
                    let timer = setInterval(() => {
                        if (getCookie('xn_api_token')) {
                            chrome.runtime.sendMessage({ action: 'CLOSE_TOKEN_TAB', tabId: tabId }, (response) => {
                                if (response.success) {
                                    authorizationToken = "Bearer " + getCookie("xn_api_token");
                                    handler();
                                    clearInterval(timer);
                                }
                            })
                        }
                    }, 2000);
                });
            }
        })
    } else {
        chrome.storage.local.set({ isCookie: true })
        handler();
    }
}

console.log(todo);
