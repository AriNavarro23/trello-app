import { combineReducers, createStore } from "redux";
import throttle from "lodash.throttle";
import seed from "./seed";

//REDUCER PARA MANEJAR EL ESTADO RELACIONADO CON EL TABLERO
// defino la const y un estado inicial con una lista vacia
const board = (state = { lists: [] }, action) => {
  //switch para manejar las acciones, se evalua el tipo de accion
  switch (action.type) {
    //agrega una lista al tablero
    case "ADD_LIST": {
      //desestructuro el payload para obtener el id y el titulo de la lista
      const { listId } = action.payload;
      //devuelve un nuevo estado con la lista agregada, se crea un array con las listas actuales y se agrega la nueva
      return { lists: [...state.lists, listId] };
    }

    //mueve una lista de posicion dentro del tablero
    case "MOVE_LIST": {
      // desestructuro para obtener los indices viejos y nuevos
      const { oldListIndex, newListIndex } = action.payload;
      //creo un nuevo array con las listas actuales sin modificar
      const newLists = Array.from(state.lists);
      //elimino la lista en la posicion vieja y la agrego en la nueva
      const [removedList] = newLists.splice(oldListIndex, 1);
      //inserta removedList en la nueva posicion
      newLists.splice(newListIndex, 0, removedList);
      //devuelve el nuevo estado con las listas modificadas en forma de objeto
      return { lists: newLists };
    }
    //elimina una lista del tablero
    case "DELETE_LIST": {
      const { listId } = action.payload;
      const filterDeleted = tmpListId => tmpListId !== listId;
      const newLists = state.lists.filter(filterDeleted);
      return { lists: newLists };
    }
    default:
      return state;
  }
};

//funcion para manejar el estado relacionado con las listas por su id
const listsById = (state = {}, action) => {
  switch (action.type) {
    //agrega una lista al estado
    case "ADD_LIST": {
      const { listId, listTitle } = action.payload;
      return {
        ...state,
        [listId]: { _id: listId, title: listTitle, cards: [] }
      };
    }
    //cambia el titulo de una lista
    case "CHANGE_LIST_TITLE": {
      const { listId, listTitle } = action.payload;
      return {
        ...state,
        [listId]: { ...state[listId], title: listTitle }
      };
    }
    //elimina una lista del estado
    case "DELETE_LIST": {
      const { listId } = action.payload;
      const { [listId]: deletedList, ...restOfLists } = state;
      return restOfLists;
    }
    //agrega una tarjeta a una lista
    case "ADD_CARD": {
      const { listId, cardId } = action.payload;
      return {
        ...state,
        [listId]: { ...state[listId], cards: [...state[listId].cards, cardId] }
      };
    }
    //Mover una tarjeta de una lista a otra
    case "MOVE_CARD": {
      const {
        oldCardIndex,
        newCardIndex,
        sourceListId,
        destListId
      } = action.payload;
      // Move within the same list
      if (sourceListId === destListId) {
        const newCards = Array.from(state[sourceListId].cards);
        const [removedCard] = newCards.splice(oldCardIndex, 1);
        newCards.splice(newCardIndex, 0, removedCard);
        return {
          ...state,
          [sourceListId]: { ...state[sourceListId], cards: newCards }
        };
      }
      // mover la tarjeta de una lista a otra
      const sourceCards = Array.from(state[sourceListId].cards);
      const [removedCard] = sourceCards.splice(oldCardIndex, 1);
      const destinationCards = Array.from(state[destListId].cards);
      destinationCards.splice(newCardIndex, 0, removedCard);
      return {
        ...state,
        [sourceListId]: { ...state[sourceListId], cards: sourceCards },
        [destListId]: { ...state[destListId], cards: destinationCards }
      };
    }
    //Eliminar una tarjeta de una lista
    case "DELETE_CARD": {
      const { cardId: deletedCardId, listId } = action.payload;
      // Define una función de filtro para eliminar la tarjeta con el ID dado
      const filterDeleted = cardId => cardId !== deletedCardId;
      // Retorna un nuevo estado donde se excluye la tarjeta eliminada del array de tarjetas de la lista especificada
      return {
        ...state,
        [listId]: {
          ...state[listId],
          cards: state[listId].cards.filter(filterDeleted)
        }
      };
    }
    default:
      return state;
  }
};

//Reducer para manejar el estado relacionado con las tarjetas por su id
const cardsById = (state = {}, action) => {
  switch (action.type) {
    case "ADD_CARD": {
      const { cardText, cardId } = action.payload;
      return { ...state, [cardId]: { text: cardText, _id: cardId } };
    }
    case "CHANGE_CARD_TEXT": {
      const { cardText, cardId } = action.payload;
      return { ...state, [cardId]: { ...state[cardId], text: cardText } };
    }
    case "DELETE_CARD": {
      const { cardId } = action.payload;
      const { [cardId]: deletedCard, ...restOfCards } = state;
      return restOfCards;
    }
    // Find every card from the deleted list and remove it
    case "DELETE_LIST": {
      const { cards: cardIds } = action.payload;
      return Object.keys(state)
        .filter(cardId => !cardIds.includes(cardId))
        .reduce(
          (newState, cardId) => ({ ...newState, [cardId]: state[cardId] }),
          {}
        );
    }
    default:
      return state;
  }
};

//combinar los reducers en uno
const reducers = combineReducers({
  board,
  listsById,
  cardsById
});

// Funcion para guardar el estado en el local storage
const saveState = state => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("state", serializedState);
  } catch {
    // ignore write errors
  }
};

//Funcion para cargar el estado del local storage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem("state");
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

//Cargar el estado del local storage
const persistedState = loadState();

//Crear el store
const store = createStore(reducers, persistedState);

//Suscribirse al store para guardar el estado en el local storage
store.subscribe(
  throttle(() => {
    saveState(store.getState());
  }, 1000)
);

//SI NO HAY LISTAS, SE AGREGAN POR DEFECTO
//imprime en consola el estado actual dle store
console.log(store.getState());
//verifica la condicion para ver si hay listas en el tablero
if (!store.getState().board.lists.length) {
  console.log("SEED");
  //si no hay listas, se agregan por defecto desde el archivo seed.js
  seed(store);
}

export default store;
