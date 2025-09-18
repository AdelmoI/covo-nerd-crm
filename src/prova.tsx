import React, { useState } from "react";
import { Button } from "./components/Button";

const MyComponent = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
    </div>
  );
};

export default MyComponent;
