enum Status {
    MASSAGE,
        SPA,
        DABAOJIAN
}

function getServr(status : any){
    if( status === Status.MASSAGE )
        return "MASSAGE";
    else if ( status === Status.SPA)
        return "SPA";
    else if( status === Status.DABAOJIAN )
        return "DABAOJIAN"
}

console.log(getServr(Status.MASSAGE))

console.log(Status.MASSAGE,Status[1])
//反查
