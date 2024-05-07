import "../styles/AddList.css";

import React, { Component } from "react";
//conecta con  el store
import { connect } from "react-redux";
import ListEditor from "./ListEditor";
import shortid from "shortid";
import EditButtons from "./EditButtons";

class AddList extends Component {
  //inicio del estado con el titulo vacio
  state = {
    title: ""
  };

  //funcion para cambiar el titulo
  handleChangeTitle = e => this.setState({ title: e.target.value });

  createList = async () => {
    //desestructuro y obtengo el titulo
    const { title } = this.state;
    //desestructuro y obtengo el dispatch
    const { dispatch } = this.props;
    //llamo al metodo
    this.props.toggleAddingList();
    //dispara accion de agregar lista, con un id y un titulo del estado
    dispatch({
      type: "ADD_LIST",
      payload: { listId: shortid.generate(), listTitle: title }
    });
  };

  
  render() {
    const { toggleAddingList } = this.props;
    const { title } = this.state;

    return (
      <div className="Add-List-Editor">
        <ListEditor
          title={title}
          handleChangeTitle={this.handleChangeTitle}
          onClickOutside={toggleAddingList}
          saveList={this.createList}
        />

        <EditButtons
          handleSave={this.createList}
          saveLabel={"Add list"}
          handleCancel={toggleAddingList}
        />
      </div>
    );
  }
}

export default connect()(AddList);
