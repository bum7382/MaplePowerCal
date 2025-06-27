// frontnend/src/utils/useSoulOptions.js
import { useEffect, useState } from "react";
import soulOptions from "@/data/soulOptions.json";

export default function useSoulOptions() {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    setOptions(soulOptions);
  }, []);

  return options;
}
