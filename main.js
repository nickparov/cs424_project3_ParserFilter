/**
You will only need a subset of the 23 columns in the data file

3. Trip Start Timestamp (string -> date and time)
5. Trip Seconds (int)
6. Trip Miles (float)
9. Pickup Community Area (int)
10. Drop-off community Area (int)
17. Company (string)

    You should also remove all trips less than 0.5 miles, 
    and more than 100 miles, and less than 60 seconds, 
    and greater than 5 hours, 
    and all trips that either start or end outside of a Chicago community area.
     We also will only be using looking at trips 
     down to a resolution of the starting hour rather than the 15 minute intervals 
     in the data. 
     
     The command line (sed, grep, etc) can be your friend doing these manipulations or you can write a program to do it, 
     or use R itself if you have enough memory, but you must document these manipulations so they are reproducible. 
     That should get you down to about 12 million rides and around 300 MB.


     The quote in "Taxicab Insurance Agency needs to be dealt with or you can lose a lot of data ???????

 */

function arrsToObj(arr1, arr2) {
    const obj = {};
    let i = 0;

    for (const val of arr1) {
        obj[val] = arr2[i];
        i++;
    }

    return obj;
}

function correctData(row) {
    if (
        parseFloat(row["Trip Miles"]) >= 0.5 &&
        parseFloat(row["Trip Miles"]) <= 100 &&
        parseInt(row["Trip Seconds"]) <= 18000 &&
        parseInt(row["Trip Seconds"]) >= 60 &&
        row["Pickup Community Area"] != false &&
        row["Dropoff Community Area"] != false
    ) {
        return true;
    } else {
        return false;
    }
}

function getAreaNameFromCode(area_code) {
    const areas = [
        "Rogers Park",
        "West Ridge",
        "Uptown",
        "Lincoln Square",
        "North Center",
        "Lake View",
        "Lincoln Park",
        "Near North Side",
        "Edison Park",
        "Norwood Park",
        "Jefferson Park",
        "Forest Glen",
        "North Park",
        "Albany Park",
        "Portage Park",
        "Irving Park",
        "Dunning",
        "Montclare",
        "Belmont Cragin",
        "Hermosa",
        "Avondale",
        "Logan Square",
        "Humboldt Park",
        "West Town",
        "Austin",
        "West Garfield Park",
        "East Garfield Park",
        "Near West Side",
        "North Lawndale",
        "South Lawndale",
        "Lower West Side",
        "The Loop",
        "Near South Side",
        "Armour Square",
        "Douglas",
        "Oakland",
        "Fuller Park",
        "Grand Boulevard",
        "Kenwood",
        "Washington Park",
        "Hyde Park",
        "Woodlawn",
        "South Shore",
        "Chatham",
        "Avalon Park",
        "South Chicago",
        "Burnside",
        "Calumet Heights",
        "Roseland",
        "Pullman",
        "South Deering",
        "East Side",
        "West Pullman",
        "Riverdale",
        "Hegewisch",
        "Garfield Ridge",
        "Archer Heights",
        "Brighton Park",
        "McKinley Park",
        "Bridgeport",
        "New City",
        "West Elsdon",
        "Gage Park",
        "Clearing",
        "West Lawn",
        "Chicago Lawn",
        "West Englewood",
        "Englewood",
        "Greater Grand Crossing",
        "Ashburn",
        "Auburn Gresham",
        "Beverly",
        "Washington Heights",
        "Mount Greenwood",
        "Morgan Park",
        "O'Hare",
        "Edgewater",
    ];

    return areas[area_code - 1];
}

function getNeededDataArr(row) {
    const date = dateTools.strToDate(row["Trip Start Timestamp"]);

    return [
        row["Trip Start Timestamp"],
        row["Trip Seconds"],
        row["Trip Miles"],
        row["Pickup Community Area"],
        row["Dropoff Community Area"],
        row["Company"], // add 6 values of time (Y/M/D/H/M/S)
        dateTools.getYear(date),
        dateTools.getMonth(date),
        dateTools.getDay(date),
        dateTools.getHour(date),
        dateTools.getMins(date),
    ];
}

function getNeededDataObj(row) {
    const date = dateTools.strToDate(row["Trip Start Timestamp"]);

    return {
        date: row["Trip Start Timestamp"],
        duration: parseInt(row["Trip Seconds"]),
        miles: parseInt(row["Trip Miles"]),
        from_area: parseInt(row["Pickup Community Area"]),
        to_area: parseInt(row["Dropoff Community Area"]),
        Company: row["Company"], // add 6 values of time (Y/M/D/H/M/S)
        year: dateTools.getYear(date),
        month: dateTools.getMonth(date),
        day: dateTools.getDay(date),
        hour: dateTools.getHour(date),
        minute: dateTools.getMins(date),
    };
}

function setNeededColumns(_arr) {
    neededColumns.push(
        ..._arr.filter((col, index) => colsIndexes.includes(index))
    );

    neededColumns.push(...["Year", "Month", "Day", "Hour", "Minute"]);

    return true;
}

function arrayToCsvLine(data) {
    return data
        .map(String) // convert every value to String
        .map((v) => v.replaceAll('"', '""')) // escape double colons
        .map((v) => `"${v}"`) // quote it
        .join(",") // comma-separated
        .concat("\r\n");
}

const dateTools = {
    strToDate: (_str) => new Date(_str),
    getYear: (_date) => _date.getFullYear(),
    getMonth: (_date) => _date.getMonth() + 1,
    getDay: (_date) => _date.getDate(),
    getMDY: (_date) =>
        `${_date.getMonth() + 1}/${_date.getDate()}/${_date.getFullYear()}`,
    getHour: (_date) => _date.getHours(),
    getMins: (_date) => _date.getMinutes(),
    getSeconds: (_date) => _date.getSeconds(),
    getHMS: (_date) =>
        `${_date.getHours()}/${_date.getMinutes()}/${_date.getSeconds()}`,
};

const { TableController } = require("./tableCtr");

class eachDayTotalRidesTable extends TableController {
    constructor() {
        const columnsArr = ["month_day", "rides", "month", "day", "date"];
        super("eachDayTotalRides", columnsArr);
    }

    addToTable = (row) => {
        // some logic
        const { day, month } = row;
        const rowIndex = `${month}/${day}`;

        // check if it already has the needed key and increment it OR create one if it does not
        if (this._hasKey(rowIndex)) {
            this._table[rowIndex] += 1;
        } else {
            this._table[rowIndex] = 1;
        }
    };

    exportToCSV = () => {
        const wstream = fs.createWriteStream(
            `${this._csvFolderPath}${this._name}_table.csv`
        );
        // write columns first
        wstream.write(arrayToCsvLine(this._columns));
        // write contents
        for (const month_day of Object.keys(this._table)) {
            const rides = this._table[month_day];
            wstream.write(
                arrayToCsvLine([
                    month_day,
                    rides,
                    month_day.split("/")[0],
                    month_day.split("/")[1],
                    `2019/${month_day.split("/")[0]}/${
                        month_day.split("/")[1]
                    }`,
                ])
            );
        }
    };
}
class eachHourTotalRidesTable extends TableController {
    constructor() {
        const columnsArr = ["hour", "rides", "hour_tw", "ampm", "hour12"];
        super("eachHourTotalRides", columnsArr);
    }

    addToTable = (row) => {
        // some logic
        const { hour } = row;
        const index = `${hour}`;

        // check if it already has the needed key and increment it OR create one if it does not
        if (this._hasKey(index)) {
            this._table[index] += 1;
        } else {
            this._table[index] = 1;
        }
    };

    convertToAmPm(h) {
        if (!Number.isInteger(h)) h = parseInt(h);
        var AMPM = h >= 12 ? "PM" : "AM";
        if (h > 12) h = h - 12;
        if (h < 1) h = h + 12;

        return {
            prefix: AMPM,
            hourValue: h,
        };
    }

    exportToCSV = () => {
        const wstream = fs.createWriteStream(
            `${this._csvFolderPath}${this._name}_table.csv`
        );

        // write columns first
        wstream.write(arrayToCsvLine(this._columns));

        // write contents
        for (const hour of Object.keys(this._table)) {
            const rides = this._table[hour];
            wstream.write(
                arrayToCsvLine([
                    hour,
                    rides,
                    this.convertToAmPm(hour).hourValue,
                    this.convertToAmPm(hour).prefix,
                    `${this.convertToAmPm(hour).hourValue} ${
                        this.convertToAmPm(hour).prefix
                    }`,
                ])
            );
        }
    };
}
class milageBinsTotalRidesTable extends TableController {
    constructor() {
        const columnsArr = ["milage", "rides"];
        super("milageBinsTotalRides", columnsArr);
    }

    addToTable = (row) => {
        // some logic
        const { miles } = row;
        const mileRange = 0.2;
        const binIdx = parseInt(miles / mileRange);
        const index = `${(binIdx * mileRange).toFixed(1)}-${(
            (binIdx + 1) *
            mileRange
        ).toFixed(1)}`;

        // check if it already has the needed key and increment it OR create one if it does not
        if (this._hasKey(index)) {
            this._table[index] += 1;
        } else {
            this._table[index] = 1;
        }
    };

    exportToCSV = () => {
        const wstream = fs.createWriteStream(
            `${this._csvFolderPath}${this._name}_table.csv`
        );

        // write columns first
        wstream.write(arrayToCsvLine(this._columns));

        // sort keys
        const keys_map = {};
        for (const milage of Object.keys(this._table)) {
            const newKey = parseFloat(milage.split("-")[0]);

            keys_map[newKey] = milage;
        }

        const keys_arr = Object.keys(keys_map).map((el) => parseFloat(el));
        keys_arr.sort((a, b) => a - b);

        // write contents
        for (const key of keys_arr) {
            const milage = keys_map[key];
            const rides = this._table[milage];
            wstream.write(arrayToCsvLine([milage, rides]));
        }
    };
}
class tripDurationBinsTotalRidesTable extends TableController {
    constructor() {
        const columnsArr = ["trip_duration", "rides"];
        super("tripDurationBinsTotalRides", columnsArr);
    }

    addToTable = (row) => {
        // some logic
        const { duration } = row;
        const duration_range = 30;
        const binIdx = parseInt(duration / duration_range);
        const index = `${(binIdx * duration_range).toFixed(1)}-${(
            (binIdx + 1) *
            duration_range
        ).toFixed(1)}`;

        // check if it already has the needed key and increment it OR create one if it does not
        if (this._hasKey(index)) {
            this._table[index] += 1;
        } else {
            this._table[index] = 1;
        }
    };

    exportToCSV = () => {
        const wstream = fs.createWriteStream(
            `${this._csvFolderPath}${this._name}_table.csv`
        );

        // write columns first
        wstream.write(arrayToCsvLine(this._columns));

        // sort keys
        const keys_map = {};
        for (const duration of Object.keys(this._table)) {
            const newKey = parseInt(duration.split("-")[0]);

            keys_map[newKey] = duration;
        }

        const keys_arr = Object.keys(keys_map).map((el) => parseInt(el));
        keys_arr.sort((a, b) => a - b);

        // write contents
        for (const key of keys_arr) {
            const duration = keys_map[key];
            const rides = this._table[duration];
            wstream.write(arrayToCsvLine([duration, rides]));
        }
    };
}
class ridesPercentageTable extends TableController {
    constructor() {
        const columnsArr = [
            "area_name",
            "area_code",
            "from",
            "to",
            "from_share",
            "to_share",
            "total_area_rides",
            "fromto",
            "identifier",
        ];
        super("ridesPercentageTable", columnsArr);
        // counter
        this._totalRides = 0;
    }

    getAreaNameFromCode(area_code) {
        const areas = [
            "Rogers Park",
            "West Ridge",
            "Uptown",
            "Lincoln Square",
            "North Center",
            "Lake View",
            "Lincoln Park",
            "Near North Side",
            "Edison Park",
            "Norwood Park",
            "Jefferson Park",
            "Forest Glen",
            "North Park",
            "Albany Park",
            "Portage Park",
            "Irving Park",
            "Dunning",
            "Montclare",
            "Belmont Cragin",
            "Hermosa",
            "Avondale",
            "Logan Square",
            "Humboldt Park",
            "West Town",
            "Austin",
            "West Garfield Park",
            "East Garfield Park",
            "Near West Side",
            "North Lawndale",
            "South Lawndale",
            "Lower West Side",
            "The Loop",
            "Near South Side",
            "Armour Square",
            "Douglas",
            "Oakland",
            "Fuller Park",
            "Grand Boulevard",
            "Kenwood",
            "Washington Park",
            "Hyde Park",
            "Woodlawn",
            "South Shore",
            "Chatham",
            "Avalon Park",
            "South Chicago",
            "Burnside",
            "Calumet Heights",
            "Roseland",
            "Pullman",
            "South Deering",
            "East Side",
            "West Pullman",
            "Riverdale",
            "Hegewisch",
            "Garfield Ridge",
            "Archer Heights",
            "Brighton Park",
            "McKinley Park",
            "Bridgeport",
            "New City",
            "West Elsdon",
            "Gage Park",
            "Clearing",
            "West Lawn",
            "Chicago Lawn",
            "West Englewood",
            "Englewood",
            "Greater Grand Crossing",
            "Ashburn",
            "Auburn Gresham",
            "Beverly",
            "Washington Heights",
            "Mount Greenwood",
            "Morgan Park",
            "O'Hare",
            "Edgewater",
        ];

        return areas[area_code - 1];
    }

    _calcPercentages = () => {
        // go through each area_code in the table
        for (const area_code of Object.keys(this._table)) {
            const to = this._table[area_code]["to"];
            const from = this._table[area_code]["from"];
            const to_from_total =
                this._table[area_code]["to"] + this._table[area_code]["from"];
            // add new field and put percentage there
            this._table[area_code]["to_share"] = (
                (to / to_from_total) *
                100
            ).toFixed(1);
            this._table[area_code]["from_share"] = (
                (from / to_from_total) *
                100
            ).toFixed(1);
            this._table[area_code]["total_area_rides"] = to_from_total;
        }
    };

    addToTable = (row) => {
        // get all areas to and from
        const { from_area, to_area } = row;

        // increment counter for total rides
        this._totalRides += 1;

        // for from_area
        if (this._hasKey(from_area)) {
            this._table[from_area]["from"] += 1;
        } else {
            this._table[from_area] = {
                name: this.getAreaNameFromCode(from_area),
                to: 0,
                from: 1,
            };
        }

        // for to_area
        if (this._hasKey(to_area)) {
            this._table[to_area]["to"] += 1;
        } else {
            this._table[to_area] = {
                name: this.getAreaNameFromCode(to_area),
                to: 1,
                from: 0,
            };
        }
    };

    exportToCSV = () => {
        const wstream = fs.createWriteStream(
            `${this._csvFolderPath}${this._name}_table.csv`
        );

        // write columns first
        wstream.write(arrayToCsvLine(this._columns));

        // calculate percentages
        this._calcPercentages();

        // For each piece of info --> from area \ to area \ rides \ percentage
        for (const area_code of Object.keys(this._table)) {
            const name = this._table[area_code]["name"];
            const to = this._table[area_code]["to"];
            const from = this._table[area_code]["from"];
            const to_share = this._table[area_code]["to_share"];
            const from_share = this._table[area_code]["from_share"];
            const total_area_rides = this._table[area_code]["total_area_rides"];

            wstream.write(
                `${arrayToCsvLine([
                    name,
                    area_code,
                    from,
                    to,
                    from_share,
                    to_share,
                    total_area_rides,
                    from_share,
                    "from",
                ])}${arrayToCsvLine([
                    name,
                    area_code,
                    from,
                    to,
                    from_share,
                    to_share,
                    total_area_rides,
                    to_share,
                    "to",
                ])}`
            );
        }
    };
}

class hourDayMonthRidesToFromTable extends TableController {
    constructor() {
        const columnsArr = [
            "area_name",
            "date",
            "to",
            "from",
            "total",
            "hour",
            "hour_tw",
            "ampm",
            "hour12",
        ];
        super("hourDayMonthRidesToFromTable", columnsArr);
    }

    getAreaNameFromCode(area_code) {
        const areas = [
            "Rogers Park",
            "West Ridge",
            "Uptown",
            "Lincoln Square",
            "North Center",
            "Lake View",
            "Lincoln Park",
            "Near North Side",
            "Edison Park",
            "Norwood Park",
            "Jefferson Park",
            "Forest Glen",
            "North Park",
            "Albany Park",
            "Portage Park",
            "Irving Park",
            "Dunning",
            "Montclare",
            "Belmont Cragin",
            "Hermosa",
            "Avondale",
            "Logan Square",
            "Humboldt Park",
            "West Town",
            "Austin",
            "West Garfield Park",
            "East Garfield Park",
            "Near West Side",
            "North Lawndale",
            "South Lawndale",
            "Lower West Side",
            "The Loop",
            "Near South Side",
            "Armour Square",
            "Douglas",
            "Oakland",
            "Fuller Park",
            "Grand Boulevard",
            "Kenwood",
            "Washington Park",
            "Hyde Park",
            "Woodlawn",
            "South Shore",
            "Chatham",
            "Avalon Park",
            "South Chicago",
            "Burnside",
            "Calumet Heights",
            "Roseland",
            "Pullman",
            "South Deering",
            "East Side",
            "West Pullman",
            "Riverdale",
            "Hegewisch",
            "Garfield Ridge",
            "Archer Heights",
            "Brighton Park",
            "McKinley Park",
            "Bridgeport",
            "New City",
            "West Elsdon",
            "Gage Park",
            "Clearing",
            "West Lawn",
            "Chicago Lawn",
            "West Englewood",
            "Englewood",
            "Greater Grand Crossing",
            "Ashburn",
            "Auburn Gresham",
            "Beverly",
            "Washington Heights",
            "Mount Greenwood",
            "Morgan Park",
            "O'Hare",
            "Edgewater",
        ];

        return areas[area_code - 1];
    }

    convertToAmPm(h) {
        if (!Number.isInteger(h)) h = parseInt(h);
        var AMPM = h >= 12 ? "PM" : "AM";
        if (h > 12) h = h - 12;
        if (h < 1) h = h + 12;

        return {
            prefix: AMPM,
            hourValue: h,
        };
    }

    addToTable = (row) => {
        // get all areas to and from
        const { from_area, to_area, month, day, hour } = row;

        const starterFrom = {
            to: 0,
            from: 1,
            total: 1,
        };
        const starterTo = {
            to: 1,
            from: 0,
            total: 1,
        };

        /**
         * Table:
         *  {
         *   area: {
         *             month: {
         *                          day: {
         *                                          hour: {
         *                                                  to: number,
         *                                                  from: number,
         *                                                  total: number
         *                                                }
         *                                }
         *                     }
         *          }
         *   }
         */

        // check area
        if (this._hasKey(from_area)) {
            // check month
            if (this._hasTableKey(this._table[from_area], month)) {
                // has month
                // check day
                if (this._hasTableKey(this._table[from_area][month], day)) {
                    // has day
                    // check hour
                    if (
                        this._hasTableKey(
                            this._table[from_area][month][day],
                            hour
                        )
                    ) {
                        // assign value
                        this._table[from_area][month][day][hour]["from"] += 1;
                        this._table[from_area][month][day][hour]["total"] += 1;
                    } else {
                        // doesn't have hour
                        this._table[from_area][month][day][hour] = {
                            ...starterFrom,
                        };
                    }
                } else {
                    // doesn't have day
                    this._table[from_area][month][day] = {
                        [hour]: { ...starterFrom },
                    };
                }
                // check hour
            } else {
                // doesnt have month
                this._table[from_area][month] = {
                    [day]: {
                        [hour]: { ...starterFrom },
                    },
                };
            }
        } else {
            this._table[from_area] = {
                [month]: {
                    [day]: {
                        [hour]: { ...starterFrom },
                    },
                },
            };
        }

        // another big if for the second "to" field
        // check area
        if (this._hasKey(to_area)) {
            // check month
            if (this._hasTableKey(this._table[to_area], month)) {
                // has month
                // check day
                if (this._hasTableKey(this._table[to_area][month], day)) {
                    // has day
                    // check hour
                    if (
                        this._hasTableKey(
                            this._table[to_area][month][day],
                            hour
                        )
                    ) {
                        // assign value
                        this._table[to_area][month][day][hour]["to"] += 1;
                        this._table[to_area][month][day][hour]["total"] += 1;
                    } else {
                        // doesn't have hour
                        this._table[to_area][month][day][hour] = {
                            ...starterTo,
                        };
                    }
                } else {
                    // doesn't have day
                    this._table[to_area][month][day] = {
                        [hour]: { ...starterTo },
                    };
                }
                // check hour
            } else {
                // doesnt have month
                this._table[to_area][month] = {
                    [day]: {
                        [hour]: { ...starterTo },
                    },
                };
            }
        } else {
            this._table[to_area] = {
                [month]: {
                    [day]: {
                        [hour]: { ...starterTo },
                    },
                },
            };
        }
    };

    exportToCSV = () => {
        const wstream = fs.createWriteStream(
            `${this._csvFolderPath}${this._name}_table.csv`
        );

        // write columns first
        wstream.write(arrayToCsvLine(this._columns));

        // For each piece of info --> from area \ to area \ rides \ percentage
        for (const area_code of Object.keys(this._table)) {
            for (const month of Object.keys(this._table[area_code])) {
                for (const day of Object.keys(this._table[area_code][month])) {
                    for (const hour of Object.keys(
                        this._table[area_code][month][day]
                    )) {
                        // ["area_name", "date", "to", "from", "total", "hour"];
                        const area_name = this.getAreaNameFromCode(area_code);
                        const date = `2019/${month}/${day}`;
                        const to =
                            this._table[area_code][month][day][hour]["to"];
                        const from =
                            this._table[area_code][month][day][hour]["from"];
                        const total =
                            this._table[area_code][month][day][hour]["total"];

                        // write
                        wstream.write(
                            arrayToCsvLine([
                                area_name,
                                date,
                                to,
                                from,
                                total,
                                hour,
                                this.convertToAmPm(hour).hourValue,
                                this.convertToAmPm(hour).prefix,
                                `${this.convertToAmPm(hour).hourValue} ${
                                    this.convertToAmPm(hour).prefix
                                }`,
                            ])
                        );
                    }
                }
            }
        }
    };
}

class milageBinsEachAreaTotalRidesTable extends TableController {
    constructor() {
        const columnsArr = ["area_name", "miles", "rides", "km"];
        super("milageBinsEachAreaTotalRides", columnsArr);
    }

    addToTable = (row) => {
        // some logic
        const { from_area, to_area, miles } = row;
        const mileRange = 0.2;
        const binIdx = parseInt(miles / mileRange);
        const index = `${(binIdx * mileRange).toFixed(1)}-${(
            (binIdx + 1) *
            mileRange
        ).toFixed(1)}`;

        const area_name_to = getAreaNameFromCode(to_area);
        // check if it already has the needed key and increment it OR create one if it does not
        if (this._hasKey(area_name_to)) {
            if (this._hasTableKey(this._table[area_name_to], index)) {
                this._table[area_name_to][index] += 1;
            } else {
                this._table[area_name_to][index] = 1;
            }
        } else {
            this._table[area_name_to] = {
                [index]: 1,
            };
        }

        const area_name_from = getAreaNameFromCode(from_area);
        // check if it already has the needed key and increment it OR create one if it does not
        if (this._hasKey(area_name_from)) {
            if (this._hasTableKey(this._table[area_name_from], index)) {
                this._table[area_name_from][index] += 1;
            } else {
                this._table[area_name_from][index] = 1;
            }
        } else {
            this._table[area_name_from] = {
                [index]: 1,
            };
        }
    };

    exportToCSV = () => {
        const wstream = fs.createWriteStream(
            `${this._csvFolderPath}${this._name}_table.csv`
        );

        // write columns first
        wstream.write(arrayToCsvLine(this._columns));

        // // sort keys
        // const keys_map = {};
        // for (const milage of Object.keys(this._table)) {
        //     const newKey = parseFloat(milage.split("-")[0]);

        //     keys_map[newKey] = milage;
        // }

        // const keys_arr = Object.keys(keys_map).map((el) => parseFloat(el));
        // keys_arr.sort((a, b) => a - b);

        // write contents
        for (const area_name of Object.keys(this._table)) {
            for (const milage of Object.keys(this._table[area_name])) {
                const rides = this._table[area_name][milage];
                const milageStr = milage;
                const start_milage = parseFloat(milageStr.split("-")[0]);
                const end_milage = parseFloat(milageStr.split("-")[1]);
                wstream.write(
                    arrayToCsvLine([
                        area_name,
                        milage,
                        rides,
                        `${(start_milage * 1.6).toFixed(1)}-${(
                            end_milage * 1.6
                        ).toFixed(1)}`,
                    ])
                );
            }
        }
    };
}

class tripDurationBinsEachAreaTotalRidesTable extends TableController {
    constructor() {
        const columnsArr = ["area_name", "time", "rides"];
        super("tripDurationBinsEachAreaTotalRides", columnsArr);
    }

    addToTable = (row) => {
        // some logic
        const { from_area, to_area } = row;

        // some logic
        const { duration } = row;
        const duration_range = 60;
        const binIdx = parseInt(duration / duration_range);
        const index = `${(binIdx * duration_range) / 60}-${
            ((binIdx + 1) * duration_range) / 60
        }`;

        const area_name_to = getAreaNameFromCode(to_area);
        // check if it already has the needed key and increment it OR create one if it does not
        if (this._hasKey(area_name_to)) {
            if (this._hasTableKey(this._table[area_name_to], index)) {
                this._table[area_name_to][index] += 1;
            } else {
                this._table[area_name_to][index] = 1;
            }
        } else {
            this._table[area_name_to] = {
                [index]: 1,
            };
        }

        const area_name_from = getAreaNameFromCode(from_area);
        // check if it already has the needed key and increment it OR create one if it does not
        if (this._hasKey(area_name_from)) {
            if (this._hasTableKey(this._table[area_name_from], index)) {
                this._table[area_name_from][index] += 1;
            } else {
                this._table[area_name_from][index] = 1;
            }
        } else {
            this._table[area_name_from] = {
                [index]: 1,
            };
        }
    };

    exportToCSV = () => {
        const wstream = fs.createWriteStream(
            `${this._csvFolderPath}${this._name}_table.csv`
        );

        // write columns first
        wstream.write(arrayToCsvLine(this._columns));

        // // sort keys
        // const keys_map = {};
        // for (const milage of Object.keys(this._table)) {
        //     const newKey = parseFloat(milage.split("-")[0]);

        //     keys_map[newKey] = milage;
        // }

        // const keys_arr = Object.keys(keys_map).map((el) => parseFloat(el));
        // keys_arr.sort((a, b) => a - b);

        // write contents
        for (const area_name of Object.keys(this._table)) {
            for (const milage of Object.keys(this._table[area_name])) {
                const rides = this._table[area_name][milage];

                wstream.write(arrayToCsvLine([area_name, milage, rides]));
            }
        }
    };
}

// show mem
function showMemory() {
    for (const [key, value] of Object.entries(process.memoryUsage())) {
        console.log(`Memory usage by ${key}, ${value / 1000000}MB `);
    }
}

const Manipulator = (function () {
    const allTables = [
        new eachHourTotalRidesTable(),
        new tripDurationBinsEachAreaTotalRidesTable(),
        new milageBinsEachAreaTotalRidesTable(),
        new hourDayMonthRidesToFromTable(),
        new ridesPercentageTable(),
        new tripDurationBinsTotalRidesTable(),
        new eachDayTotalRidesTable(),
        new milageBinsTotalRidesTable()
    ];

    function init() {}

    function exportAllTables() {
        for (const tableCtr of allTables) tableCtr.exportToCSV();
    }

    function process(row) {
        for (const tableCtr of allTables) tableCtr.addToTable(row);
    }

    function print() {
        for (const tableCtr of allTables) console.log(tableCtr._table);
    }

    return { init, process, print, exportAllTables };
})();

const fs = require("fs");
const nReadlines = require("n-readlines");

const csvfolderExists = fs.existsSync("csv");
if (!csvfolderExists) fs.mkdirSync("csv");

const broadbandLines = new nReadlines("data.csv");
let wstream = fs.createWriteStream("data-filtered.csv");

let line;
let lineNumber = 1;
let trueElsNum = 0;
const colsIndexes = [2, 4, 5, 8, 9, 16];
const columns = [];
const neededColumns = [];

// line by line
while ((line = broadbandLines.next())) {
    // pare to ASCII
    const lineStr = line.toString("ascii");
    // if first line -> get columns array
    lineNumber === 1 &&
        columns.push(...lineStr.split(",")) &&
        setNeededColumns(lineStr.split(",")) &&
        wstream.write(arrayToCsvLine(neededColumns));

    // get values arr
    const values = lineStr.split(",");
    // get data object
    const data = arrsToObj(columns, values);

    if (correctData(data)) {
        // get needed part from curr data
        const dataArr = getNeededDataArr(data);

        // getNeededDataObj(data).miles > 30 && getNeededDataObj(data).miles <= 60 && console.log(getNeededDataObj(data).miles)
        Manipulator.process(getNeededDataObj(data));

        trueElsNum++;

        // save to csv
        wstream.write(arrayToCsvLine(dataArr));

        // show mem
        if (trueElsNum % 250000 === 0) showMemory();
    }

    lineNumber++;

    // if (trueElsNum === 1000000) {
    //     break;
    // }
}

Manipulator.print();
Manipulator.exportAllTables();

// const generateTestYearData = (function () {
//     // code
//     const { generateRandNum } = require("./utils");
//     const cols = ["area_name", "date", "hour", "to", "from", "total"];
//     const areas = [
//         "Rogers Park",
//         "West Ridge",
//         "Uptown",
//         "Lincoln Square",
//         "North Center",
//         "Lake View",
//         "Lincoln Park",
//         "Near North Side",
//         "Edison Park",
//         "Norwood Park",
//         "Jefferson Park",
//         "Forest Glen",
//         "North Park",
//         "Albany Park",
//         "Portage Park",
//         "Irving Park",
//         "Dunning",
//         "Montclare",
//         "Belmont Cragin",
//         "Hermosa",
//         "Avondale",
//         "Logan Square",
//         "Humboldt Park",
//         "West Town",
//         "Austin",
//         "West Garfield Park",
//         "East Garfield Park",
//         "Near West Side",
//         "North Lawndale",
//         "South Lawndale",
//         "Lower West Side",
//         "The Loop",
//         "Near South Side",
//         "Armour Square",
//         "Douglas",
//         "Oakland",
//         "Fuller Park",
//         "Grand Boulevard",
//         "Kenwood",
//         "Washington Park",
//         "Hyde Park",
//         "Woodlawn",
//         "South Shore",
//         "Chatham",
//         "Avalon Park",
//         "South Chicago",
//         "Burnside",
//         "Calumet Heights",
//         "Roseland",
//         "Pullman",
//         "South Deering",
//         "East Side",
//         "West Pullman",
//         "Riverdale",
//         "Hegewisch",
//         "Garfield Ridge",
//         "Archer Heights",
//         "Brighton Park",
//         "McKinley Park",
//         "Bridgeport",
//         "New City",
//         "West Elsdon",
//         "Gage Park",
//         "Clearing",
//         "West Lawn",
//         "Chicago Lawn",
//         "West Englewood",
//         "Englewood",
//         "Greater Grand Crossing",
//         "Ashburn",
//         "Auburn Gresham",
//         "Beverly",
//         "Washington Heights",
//         "Mount Greenwood",
//         "Morgan Park",
//         "O'Hare",
//         "Edgewater",
//     ];

//     const tStream = fs.createWriteStream("testEachDayHourData.csv");

//     tStream.write(arrayToCsvLine(cols), () => {
//         for (let k = 0; k < areas.length; k++) {
//             for (let i = 1; i < 13; i++) {
//                 for (let j = 1; j < 32; j++) {
//                     for (let hour = 0; hour < 24; hour++) {
//                         tStream.write(
//                             arrayToCsvLine([
//                                 `${areas[k]}`,
//                                 `2019/${i}/${j}`,
//                                 `${hour}`,
//                                 `${generateRandNum(1, 250)}`,
//                                 `${generateRandNum(1, 250)}`,
//                                 `${generateRandNum(300, 500)}`,
//                             ])
//                         );
//                     }
//                 }
//             }
//         }
//     });
// })();
