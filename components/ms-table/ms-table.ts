import * as avalon from 'avalon2';
import '../ms-checkbox/ms-checkbox';
import * as $ from 'jquery';
import './ms-table-header';
import './ms-table-util';
import '../ms-pagination/ms-pagination';
import {
    findParentComponent,
    parseSlotToVModel
} from '../../ane-util';
// import '../ms-loading';

avalon.component('ms-table', {
    soleSlot: 'header',
    template: require('./ms-table.html'),
    defaults: {
        columns: [],
        data: [],
        currentPage:1,
        prePageSize:20,
        key: 'id',
        loading: false,
        display:'none',
        needSelection: false,
        checked: [],
        selection: [],
        isAllChecked: false,
        isTitle:false,
        onSelect: avalon.noop,
        onSelectAll: avalon.noop,
        selectionChange: avalon.noop,
        handleCheckAll: function(e) {
            var _this = this;
            var data = _this.data;
            if (e.target.checked) {
                data.forEach(function(record) {
                    _this.checked.ensure(record[_this.key]);
                    _this.selection.ensure(record);
                });
            } else {
                if (data.length > 0) {
                    this.checked.clear();
                    this.selection.clear();
                } else {
                    this.checked.removeAll(function(el) { return data.map(function(record) { return record[_this.key]; }).indexOf(el) !== -1; });
                    this.selection.removeAll(function(el) { return data.indexOf(el) !== -1; });
                }
            }
            this.selectionChange(this.checked, this.selection.$model);
            this.onSelectAll(e.target.checked, this.selection.$model);
        },
        handleCheck: function(checked, record) {
            if (checked) {
                this.checked.ensure(record[this.key]);
                this.selection.ensure(record);
            } else {
                this.checked.remove(record[this.key]);
                this.selection.remove(record);
            }
            this.selectionChange(this.checked, this.selection.$model);
            this.onSelect(record.$model, checked, this.selection.$model);
        },
        actions: avalon.noop,
        handle: function(type, col, record, $index) {
            var extra = [];
            for (var _i = 4; _i < arguments.length; _i++) {
                extra[_i - 4] = arguments[_i];
            }
            var text = record[col.dataIndex].$model || record[col.dataIndex];
            this.actions.apply(this, [type, text, record.$model, $index].concat(extra));
        },
        onChange: avalon.noop,
        onInit: function(event) {
            var _this = this;
            var descriptor = getChildTemplate(this);
            descriptor.forEach(function(column) {
                if (column.props.type == 'selection') {
                    _this.key = column.props.dataIndex || _this.key;
                    _this.needSelection = true;
                    return false;
                }
            });
            this.columns = getColumnConfig(descriptor);
            this.$watch('checked.length', function(newV) {
                var currentPageKeys = _this.data
                    .map(function(record) { return record[_this.key]; });
                _this.isAllChecked = currentPageKeys
                    .filter(function(key) { return _this.checked.contains(key); })
                    .length == currentPageKeys.length;
            });
            this.$watch('data', function(v) {
                _this.isAllChecked = false;
                _this.checked.clear();
                _this.selection.clear();
                tableSaikaColumn();
            });
            this.$watch('data.length', function(v) {
                _this.isAllChecked = false;
                _this.checked.clear();
                _this.selection.clear();
                tableSaikaColumn();
            });
            this.$watch('loading', function(v) {
                if(v){
                    this.display = 'block';
                }else{
                    this.display = 'none';
                }
            });
            tableSaikaColumn();
        },
        onReady: function(event) {
            //tableSaikaColumn();
            $(window).resize(function(){//监测浏览器发生大小变化
                tableSaikaColumn();
            });
        },
        onDispose: function(vm, el) {}
    }
});

function getColumnConfig(descriptor, level = 1) {
    return descriptor.reduce((acc, column) => {
        if (column.is != 'ms-table-header') return acc;
        if (column.props.type == 'selection') {
            return acc;
        }
        if (column.props.type == 'index') {
            acc.push({
                title: column.props.title,
                dataIndex: '',
                template: '{{$index + 1}}'
            });
            return acc;
        }
        let inlineTemplate = column.inlineTemplate;
        inlineTemplate = inlineTemplate.replace(/(ms-|:)skip="[^"]*"/g, '');
        inlineTemplate = inlineTemplate.replace(/<\s*ms-table-header[^>]*>.*<\/\s*ms-table-header\s*>/g, '');
        inlineTemplate = inlineTemplate.replace(/(ms-|:)click="handle\(([^"]*)\)"/g, ($0, $1, $2, $3) => {
            return `${$1}click="handle(${$2},)"`.replace(/,/, ', col, record, $index,').replace(/,\)/, ')');
        });
        acc.push({
            title: column.props.title,
            dataIndex: column.props.dataIndex || '',
            template: /^\s*$/.test(inlineTemplate) ? '{{record.' + column.props.dataIndex + '}}' : inlineTemplate
        });
        return acc.concat(getColumnConfig(column.children, level + 1));
    }, []);
}

function getChildTemplate(vmodel, render = vmodel.$render): any[] {
    if (render.directives === undefined) {
        return [];
    }
    return render.directives.reduce((acc, action) => {
        if (action.is) {
            acc.push({
                is: action.is,
                props: action.value,
                inlineTemplate: action.fragment,
                children: getChildTemplate(vmodel, action.innerRender || { directives: [] })
            });
        }
        return acc;
    }, []);
}

function tableSaikaColumn(){
    $(".ane-table-fixed-thead table").width($('.ane-table-fixed-tbody .table thead').width()+3);      
    $(".ane-table-fixed-thead  table").children("thead").find("th").each(function(){ 
        let idx = $(this).index();         
        let td=$('.ane-table-fixed-tbody table').children('thead').find("th").eq(idx);
        //console.log(idx+"--"+ $(this).width());
        //console.log(idx+"++"+  td.width());
        $(this).width(td.width());
    }); 
}