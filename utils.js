function generateRandNum(min, max) {
    return Math.floor(Math.random() * max) + min;
}


function swap(arr, i, j) {
    let tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}


// generate arr with nums of size N
function generateRandArrOfSize(n, maxNum = 1000) {
    if (n > maxNum) {
        throw new Error("n is greater than maxNum!");
    }

    let arr = Array(n);
    let ignore = [];

    // O(n)
    for (let i = 0; i < n; i++) {
        let randNum = generateRandNum(0, maxNum);

        // O(n)
        while(ignore.includes(randNum))
            randNum = generateRandNum(0, maxNum);

        arr[i] = randNum;
        ignore.push(randNum);
    }

    return arr;
}  

function plainSearch(arr, needle) {
    let foundIdx = -1;
    for(let i = 0; i < arr.length; i++) {
        if(arr[i] === needle) {
            foundIdx = i;
            break;
        }
    }

    return foundIdx;
}

function binSearch(arr, val, low, high) {

    const mid = Math.floor((high+low)/2);

    if(arr[mid] === val){ 
        return mid;
    }
    else if(val < arr[mid]) {
        // left side
        return binSearch(arr, val, low, mid-1);
    } else if(val > arr[mid]) {
        // right
        return binSearch(arr, val, mid+1, high);
    } 

    return -1;
}


function shuffle(arr) {
    let high = arr.length-1;
    while(high >= 0) {
        const idx = generateRandNum(0, high);
        swap(arr, idx, high);
        high--;
    }
}


module.exports = {
    generateRandArrOfSize, 
    generateRandNum,
    swap,
    binSearch,
    plainSearch,
    shuffle
}