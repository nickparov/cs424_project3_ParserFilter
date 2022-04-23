class TableController {
    constructor(tName, columnsArr) {
        this._name = tName;
        this._columns = columnsArr;
        this._csvFolderPath = "./csv/";
    }

    // private
    _table = {};
    _columns = [];
    _hasKey = (key) => this._table[key] !== undefined;
    _hasTableKey = (table, key) => table[key] !== undefined;

    addToTable = () => true;

    exportToCSV = () => true;
}

module.exports = {
    TableController
}