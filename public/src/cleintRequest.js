const PORT = 8000;
const baseUrl = "http://localhost:" + PORT + "/";

export async function post(e, parcel, refreshPage){
    if (!parcel){ console.log("Can not post without data"); return }

    // if (!parcel.referesh){ e.preventDefault();}
    if (!refreshPage && e){ e.preventDefault();}
    if (!parcel.uri){ console.log("Can not post without uri"); return }

    const res = await fetch(parcel.uri,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json", 
            },
            body: JSON.stringify({
                data: parcel.data || null // data
            })
        }
    )
    const data = await res.json();
    return data;
}

export async function get(e, uri, refreshPage){
    if (!refreshPage && e){ e.preventDefault();}

    try{
        const res = await fetch(uri);
        if (!res.ok){ console.log("Error"); return }
        const data = await res.json();
        return data;
    } catch(err){
        console.log(err);
    }
}
