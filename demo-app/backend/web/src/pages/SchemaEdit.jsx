import React from "react";
import { observer } from "mobx-react";
import { observable, autorun } from "mobx";
import Ripple from "../utils/Ripple";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { MDCTextFieldHelperText } from '@material/textfield/helper-text';
import { MDCSnackbar } from '@material/snackbar';
import { Container, Row, Col } from 'reactstrap';
import Snackbar from "../utils/Snackbar";
import FormModel from '../models/FormModel';
import RestError from '../utils/RestError';
import AuthModel from "../models/AuthModel";
import SensorSchemaModel from "../models/SensorSchemaModel";

@observer
export default class extends React.Component {
    @observable failedFetching = false;
    @observable notFound = false;
    @observable object;
    @observable key = 0;

    form;


    schemaTypes = [
        'boolean',
        'double',
        'int64',
        'string',
        'array',
        'struct',
        'blob',
        'date'
    ];

    /**
     * @type {import('../../../../mqtt-gateway-nodejs/src/schema').SchemaT}
     */
    schema;

    constructor(props) {
        super(props);
        this.state = {
            back: false,
        }
        this.form = new FormModel();
        autorun(() => {
            if (this.isAdd()) {
                this.schema = {
                    type: 'struct',
                    fields: [
                        {
                            locked: true,
                            type: 'int64',
                            field: 'timestamp',
                            optional: false,
                        }
                    ],
                    optional: false,
                    typeLocked: true,
                };
                return;
            }
            this.failedFetching = !SensorSchemaModel.fetching && !SensorSchemaModel.fetched;
            let notFound = true;
            let object;
            if (SensorSchemaModel.fetched) {
                const objects = SensorSchemaModel.data.filter((object) => (object.id == this.props.match.params.id));
                if (objects.length >= 1) {
                    object = objects[0];
                    notFound = false;
                }
            }
            this.notFound = notFound;
            if (notFound) {
                return;
            }
            this.object = object;
            if (object && this.form.ref) {
                this.form.ref.elements["name"].value = object.name;
                this.form.ref.elements["description"].value = object.description;
                document.querySelectorAll('.mdc-text-field').forEach((node) => {
                    MDCTextField.attachTo(node);
                });
            }
            this.schema = JSON.parse(object.schema);
            this.schema.fields.unshift({
                locked: true,
                type: 'int64',
                field: 'timestamp',
                optional: false,
            });

        });
    }

    componentWillMount() {
        SensorSchemaModel.fetch(AuthModel.userInfo.get("id"));
    }

    componentDidMount() {
        document.querySelectorAll('.mdc-text-field').forEach((node) => {
            MDCTextField.attachTo(node);
        });
        document.querySelectorAll('.mdc-select').forEach((node) => {
            MDCSelect.attachTo(node);
        });
        document.querySelectorAll('.mdc-text-field-helper-text').forEach((node) => {
            MDCTextFieldHelperText.attachTo(node);
        });
    }


    /**
     * 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').SchemaT} field 
     * @param {string} value 
     */
    changeType(field, value) {
        if (field.type === value) {
            //nothing to change;
            return;
        }
        field.type = value;
        switch (value) {
            case 'blob':
                field.name = field.name || '';
                break;
            case 'array':
                field.items = field.items || { type: 'int64', optional: false };
                break;
            case 'struct':
                field.fields = field.fields || [];
                break;
            default:
                break;
        }
        this.setState({ schema: this.schema });
    }

    isAdd() {
        return this.props.match.params.id === 'new';
    }

    update(e) {
        if (e) {
            e.preventDefault();
        }
        let schema = { ...this.schema };
        // remove timestamp from schema
        schema.fields = schema.fields.filter(x => !x.locked);
        let toUpdate = {
            name: this.form.values.name,
            description: this.form.values.description,
            schema: JSON.stringify(schema),
        }
        if (this.isAdd()) {
            return this.add(toUpdate);
        }
        SensorSchemaModel.update(AuthModel.userInfo.get("id"), this.props.match.params.id, toUpdate).then((response) => {
            this.form.clearForm();
            this.setState({ back: true });
            SensorSchemaModel.fetch(AuthModel.userInfo.get("id"));
            Snackbar.show("Updated schema", "success");
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    add(toUpdate) {
        SensorSchemaModel.add(AuthModel.userInfo.get("id"), toUpdate).then((response) => {
            this.form.clearForm();
            this.setState({ back: true });
            SensorSchemaModel.fetch(AuthModel.userInfo.get("id"));
            Snackbar.show("Updated schema", "success");
        }).catch((error) => {
            Snackbar.show(new RestError(error).getMessage());
        });
    }

    render() {
        const schema = this.getSchemaWithBoilerPlateSchema(this.schema);
        window['schema'] = this.schema;
        return <div>
            <h3 className="mdc-typography--headline3">{this.isAdd() ? 'Add' : 'Edit'} schema Schema</h3>
            <br />
            {
                (!this.isAdd() && (this.failedFetching || !SensorSchemaModel.fetched || this.notFound)) && (
                    <div>
                        <h5 className="mdc-typography--headline5">{this.failedFetching ? 'Failed getting schema info' : (!SensorSchemaModel.fetched ? 'Fetching schema info' : 'Schema not found')}</h5>
                    </div>
                )
            }
            <form onSubmit={() => this.update()} ref={this.form.setRef}>
                <div style={{ display: (!this.isAdd() && (this.failedFetching || !SensorSchemaModel.fetched || this.notFound)) ? 'none' : undefined }}>
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="schema-update-name" name="name" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="schema-update-name" className="mdc-floating-label">Name</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col >
                    </Row >
                    <Row className="mb-1">
                        <Col md="6">
                            <div className="mdc-text-field" style={{ width: "100%" }}>
                                <input type="text" id="schema-update-description" name="description" onChange={this.form.handleChange} className="mdc-text-field__input" autoComplete="off" data-lpignore="true" />
                                <label htmlFor="schema-update-description" className="mdc-floating-label">[Optional] Description</label>
                                <div className="mdc-line-ripple"></div>
                            </div>
                        </Col>
                    </Row>
                    {this.renderSchemaStructField(schema)}
                </div>
                <input type="submit" style={{ visibility: "hidden", position: "absolute", left: "-9999px", width: "1px", height: "1px" }} />
                <div className="mt-5">
                    <Link to={'/users/' + AuthModel.userInfo.get("id") + '/schemas/'} className="plain-link"><Ripple className="mdc-button" style={{ textTransform: "none" }}>Back</Ripple></Link>
                    {
                        (this.isAdd() || !(this.failedFetching || !SensorSchemaModel.fetched || this.notFound)) && (
                            <Ripple onClick={this.update.bind(this)} className={"ml-4 mdc-button mdc-button--unelevated" + (SensorSchemaModel.updating ? " disabled" : "")} style={{ textTransform: "none" }}>Submit</Ripple>
                        )
                    }
                </div>
            </form>
            <br/><br/><br/><br/>
        </div>
    }

    /**
     * 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchemaStruct} schama 
     * @returns {import('../../../../mqtt-gateway-nodejs/src/schema').SchemaT}
     */
    getSchemaWithBoilerPlateSchema(schama) {
        if (!this.schema) {
            return undefined;
        }
        return {
            locked: true,
            type: 'struct',
            optional: false,
            fields: [
                {
                    locked: true,
                    field: 'sensors',
                    type: 'array',
                    optional: false,
                    items: {
                        locked: true,
                        type: 'struct',
                        optional: false,
                        fields: [
                            {
                                locked: true,
                                field: 'name',
                                type: 'string',
                                optional: false,
                            },
                            {
                                locked: true,
                                field: 'values',
                                type: 'array',
                                optional: false,
                                items: schama
                            },
                        ]
                    }
                }
            ]
        };
    }

    /**
     * 
     * @param {Event} e
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').SchemaT & {locked?: true, typeLocked?: true}} field 
     */
    toggleRequired(e, field) {
        e.preventDefault();
        if (field.locked || field.typeLocked) { return; }
        field.optional = !field.optional;
        this.setState({ schema: this.schema });
    }

    /**
     * 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').SchemaT & {locked?: true, typeLocked?: true}} field 
     * @param {string} key
     */
    renderSchemaField(field) {
        // console.log(field);
        const locked = field.typeLocked || field.locked || false;
        return (
            <span className={'schema-field schema-field-' + field.type}>
                {locked ? (
                    <span>
                        <span className="schema-field-type">{field.type}</span>
                        <span className="schema-field-optional-btn">{field.optional ? 'optional' : 'required'}</span>
                    </span>
                ) : (<span>
                    <select className="schema-field-type" name="type" onChange={event => !locked && this.changeType(field, event.target.value)} value={field.type}>
                        {
                            this.schemaTypes.map(el => <option value={el} key={el}> {el} </option>)
                        }
                    </select>
                    <button className="schema-field-optional-btn" onClick={(e) => this.toggleRequired(e, field)}>
                        {
                            field.optional ? 'optional' : 'required'
                        }
                    </button>
                </span>
                )}

                {
                    (() => {
                        switch (field.type) {
                            case 'array':
                                return this.renderSchemaArrayField(field);
                            case 'blob':
                                return this.renderSchemaBlobField(field);
                            case 'struct':
                                return this.renderSchemaStructField(field);
                            default:
                                return '';
                        }
                    })()
                }
            </span>
        )
    }

    /**
     * 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchemaArray} field 
     */
    renderSchemaArrayField(field) {
        return (<span>
            <div>
                {field.locked ? (null) : (
                    <button className="schema-field-struct-collapse-btn" onClick={(e) => this.toggleCollapse(e, field)}>{field.collapsed ? 'v' : '^'}</button>
                )}
                {'['}
            </div>
            {field.collapsed ? (null) : (
                <div className="schema-field-array-item">
                    {this.renderSchemaField(field.items)}
                </div>
            )
            }
            <div>
                {']'}
            </div>
        </span>
        );
    }

    /**
    * 
    * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchemaStruct & {locked ?: true}} field 
    */
    addElementToStruct(e, field) {
        e.preventDefault();
        field.fields.push({ type: 'int64', optional: false, field: 'key' });
        this.setState({ schema: this.schema });
    }

    /**
     * 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchemaStruct & {locked ?: true}} field 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchema & {locked ?: true}} child 
     */
    removeStructItem(e, field, child) {
        e.preventDefault();
        field.fields = field.fields.filter(x => x !== child);
        this.setState({ schema: this.schema });
    }

    changeStructFieldKey(field, value) {
        field.field = value;
        this.setState({ schema: this.schema });
    }

    /**
     * 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchema & {collapsed?: boolean}} field 
     */
    toggleCollapse(e, field) {
        e.preventDefault();
        field.collapsed = !field.collapsed;
        this.setState({ schema: this.schema });
    }

    /**
     * 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchemaStruct & {locked ?: true, collapsed?: boolean}} field 
     */
    renderSchemaStructField(field) {
        if (!field) {
            return;
        }
        return <span>
            <div>
                {field.locked ? (null) : (
                    <button className="schema-field-struct-collapse-btn" onClick={(e) => this.toggleCollapse(e, field)}>{field.collapsed ? 'v' : '^'}</button>
                )}
                {'{'}
            </div>
            {field.collapsed ? (null) :
                (<span>
                    {field.fields.map(child => {
                        return (<div className="schema-field-struct-field">
                            <span className="schema-field-struct-field-key">
                                {field.locked || child.locked ?
                                    child.field
                                    : (
                                        <span>
                                            <button className="schema-field-struct-delete" onClick={(e) => this.removeStructItem(e, field, child)}>-</button>
                                            <input type="text" onChange={(event) => this.changeStructFieldKey(child, event.target.value)} autoComplete="off" value={child.field} />
                                        </span>
                                    )}
                                :
                            </span>
                            {this.renderSchemaField(child, child.field)}
                        </div>)
                    })}
                    {field.locked ? (null) : (
                        <button className="schema-field-struct-add" onClick={(e) => this.addElementToStruct(e, field)}>+</button>
                    )}
                </span>)
            }
            <div>
                {'}'}
            </div>
        </span>;
    }

    /**
    * 
    * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchemaBlob} field 
    * @param {string} value
    */
    changeBlobName(field, value) {
        field.fileFieldName = value;
        this.setState({ schema: this.schema });
    }
    /**
     * 
     * @param {import('../../../../mqtt-gateway-nodejs/src/schema').ISchemaBlob} field 
     */
    renderSchemaBlobField(field) {
        return (
            <div className="schema-field-blob-field">
                <span>FieldName:</span>
                <input type="text" onChange={(event) => this.changeBlobName(field, event.target.value)} autoComplete="off" value={field.fileFieldName} />
            </div>
        );
    }
}
