var authorizationToken = "Bearer " + getCookie("xn_api_token");
var uid = null, sid = null;

var courses = [];

var todo = {
    lecture: [],
    assignment: [],
};

function gapTime(date){
    return new Date(date).getTime() - new Date().getTime();
}

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
}

getCourses();
getSID();
getLecture();

todo;
