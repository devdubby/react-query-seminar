import React from "react";
import { useQuery } from "react-query";
import axios from "axios";

function ProductsExample() {
  const { isLoading, error, data, isFetching } = useQuery("repoData", () =>
    axios.get(
      "https://fakestoreapi.com/products/category/jewelery"
    ).then((res) => res.data),
  );

  if (isLoading) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <ul style={{ display: "flex", listStyle: "none", padding: 0 }}>
      {data.map((product) => <li>
        <img src={product.image} width="100px" height="100px" />
      </li>)}
    </ul>
  );
}

export default ProductsExample;
