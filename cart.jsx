
// sumulate getting products from DataBase
const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = (props) => {
  const [items, setItems] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const {
    Card,
    Accordion,
    Button,
    Container,
    Row,
    Col,
    Image,
    ListGroup,
    Badge,
  } = ReactBootstrap;
  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState("http://localhost:1337/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "http://localhost:1337/api/products",
    {
      data: [],
    }
  );
  console.log(`Rendering Products ${JSON.stringify(data)}`);

  useEffect(() => {
    const dbProduct = [];
    data.data.map(product => {
      dbProduct.push(product.attributes)
    })
    setItems(dbProduct)
  }, [isLoading]);
  
  // Fetch Data
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    if (item[0].instock == 0) return;
    item[0].instock = item[0].instock - 1;
    console.log(`add to Cart ${JSON.stringify(item)}`);
    setCart([...cart, ...item]);
  };
  const deleteCartItem = (delIndex) => {
    // this is the index in the cart not in the Product List

    let newCart = cart.filter((item, i) => delIndex != i);
    let target = cart.filter((item, index) => delIndex == index);
    let newItems = items.map((item, index) => {
      if (item.name == target[0].name) item.instock = item.instock + 1;
      return item;
    });
    setCart(newCart);
    setItems(newItems);
  };


  let list = items.map((item, index) => {
    return (
      <ListGroup.Item key={index}
      as="li"
      className="d-flex justify-content-between align-items-start"
      >
      <Image src={item.imagesURL} width={70} height={70} roundedCircle></Image>
      <div className="ms-2 me-auto">
        <div className="fw-bold">{item.name}</div>
        Stock:{item.instock}
      </div>
      <Button variant="success" name={item.name} type="button" onClick={addToCart}>Add to Cart</Button>
      <Badge bg="warning" pill>
      ${item.cost}
      </Badge>
    </ListGroup.Item>
    );
  });
  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header>
          <Button onClick={() => deleteCartItem(index)}>
          {item.name}
          </Button>
        </Card.Header>
        <Card.Body>
            $ {item.cost} from {item.country}
        </Card.Body>
       </Card>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    //cart.map((item, index) => deleteCartItem(index));
    return newTotal;
  };
  const restockProducts = (url) => {
    doFetch(url);
    let newItems = data.map((item) => {
      let { name, country, cost, instock, imagesURL } = item;
      return { name, country, cost, instock, imagesURL };
    });
    setItems([...items, ...newItems]);
  };

  return (
    <Container>
      <Row className="d-flex flex-column text-center p-4">
          <h1 className="mb-3">React Shopping Cart</h1>
          <h2>Welcome To The Store</h2>
      </Row>
      <Row className="mt-4">
        <Col>
          <h3>Product List</h3>
          <ListGroup as="ul">{list}</ListGroup>
          <form
          onSubmit={(event) => {
            restockProducts(`http://localhost:1337/${query}`);
            console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button className="mt-3" variant="primary" type="submit">ReStock Products</Button>
        </form>
        </Col>
        <Col>
          <h3>Cart Contents</h3>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col>
          <h3>CheckOut </h3>
          <Button className="mt-3" onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));
