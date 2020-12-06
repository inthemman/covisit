let db = new Dexie("visitors_database");
db.version(1).stores({
    visitors:'++id,date,tel,resi',
    pwd:'val'
});
document.getElementById('dbshow').addEventListener("click",function()  {
    let dbscreen = document.getElementById("dbscreen");
    if(this.innerText=="V") {
        dbscreen.style.display = "block";
        this.innerText = "X";
        console.log("FORGIVE FOR MY MISTKAE");
    } else if(this.innerText=="X") {
        dbscreen.style.display = "none";
        this.innerText = "V";
        console.log("DD")
    }
    console.log(this.innerText)
});
document.getElementById('pwdSub').addEventListener('click',() => {
    let pwdVal = document.getElementById("pwdVal").value;
    let realVal;
    if(localStorage.pwd) {
        if(localStorage.pwd == pwdVal) {
            db.visitors.each(visit => {
                console.log(visit);
                let grid = document.getElementById("grid");
                grid.innerHTML += `<div>${visit.date.toLocaleString()}</div><div>${visit.tel}</div><div>${visit.resi}</div>`;
            })
        } else {
            alert("비밀번호가 맞지 않습니다.")
        }
    } else {
        localStorage.pwd = pwdVal;
        alert("입력한 비밀번호로 설정되었습니다.")
    }
    // db.pwd.count(count=>{
    //     if(count != 0) {
    //         console.log("PWD EXIST");
    //         db.pwd.each(function(pwd) {
    //             console.log(pwd);
    //             realVal = pwd;
    //         }).then(() => {
    //             console.log(realVal,pwdVal);
    //             if(pwdVal == realVal.val) {
    //             } else {
    //                 console.log("NONONONO")
    //             }

    //         }).catch(err=>{
    //             throw err
    //         })
            
    //     } else {
    //         console.log("NO")
    //         document.getElementById("msg").innerText = "비밀번호가 변경됩니다."
    //         db.pwd.put({
    //             val : pwdVal
    //         }) 
    //     }
    // })
})

