$(()=>{
    const submit_ele = $("#submit"); 
    //验证
    submit_ele.click(()=>{
        const  account_ele = $("#user"),
            password_ele = $("#password");
            const userInfo = {
                username:account_ele.val(),
                password:password_ele.val(),
             }
             const requestHeader = new Headers();
             requestHeader.append("Content-type","application/json;charset=UTF-8");

                fetch("/login",{
                    method:"POST",
                    headers:requestHeader,
                    mode:"cors",
                    body:JSON.stringify(userInfo)
                });

            })

});