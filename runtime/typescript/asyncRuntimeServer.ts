importScripts("runtime.js");

var nextId = 0;

onmessage = function (e)
{
    if (e.data.id != nextId)
        throw "expected message " + nextId + " but received " + e.data.id + "; fix: cache unordered messages";
    nextId++;

    try
    {
        (<any>postMessage)({
            "id": e.data.id,
            "evaluated": eval(e.data.code)
        });
    }
    catch (ex)
    {
        console.log("ERROR IN: " + e.data.code);
        throw ex;
    }
}