let mode = 1; // 0: normal, 2: wide

// utils
function getCookie(name) {
    let value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value ? value[2] : null;
};

function addBroadBtn() {
    const app = document.querySelector('#application');
    const btn = document.createElement('button');
    btn.innerText = "WIDE";
    btn.classList.add("broadbtn");
    btn.onclick = () => {
        broadCSS();
    }
    app.insertBefore(btn, app.firstChild);
}

function broadCSS() {
    const body = document.querySelector("body");
    const header = document.querySelector('#header');
    const wrapper = document.querySelector('#wrapper');
    const dashboard = document.querySelector('#dashboard');
    !mode && !dashboard ? body.classList.add("course-menu-expanded") : body.classList.remove('course-menu-expanded');
    header.style = !mode ? "display: block;" : "display: none;";
    wrapper.style = !mode ? "margin-left: 55px !important;" : "margin-left: 0px !important;";
    mode = !mode;
}

addBroadBtn();
