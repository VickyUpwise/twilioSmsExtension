import { useEffect, useRef, useState } from "react";
import { getAllRecords } from "../../ContextApi/zohoApis";
import { IoIosAddCircleOutline } from "react-icons/io";
import { Box, List, ListItem, ListItemIcon, Checkbox, ListItemText, ListItemButton} from "@mui/material";
import './addMoreRecords.scss'

const listStyle = {
  maxHeight: '200px',
    overflowX: 'clip',
    overflowY: 'scroll',
    scrollBehavior: 'smooth',
    scrollbarWidth: 'thin',
}
const AddMoreRecords = ({ entity, existingRecords, setRecords, availableRecords, setAvailableRecords}) => {
  const [showList, setShowList] = useState(false)
  
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    if (showList) fetchMore(); 
  }, [showList])


  // keep pagination state out of re-render loop
  const pageRef = useRef(0);       // starts at 0; first click loads page 1
  const hasMoreRef = useRef(true); // Zoho has more pages?
  const busyRef = useRef(false);   // guard double-clicks

  const fetchMore = async () => {
    if (busyRef.current || !hasMoreRef.current) return;
    busyRef.current = true;
    setLoading(true);

    const nextPage = pageRef.current + 1;
    const { extractedRecords, more } = await getAllRecords(entity, nextPage, 50);

    const existingIds = new Set(existingRecords.map(r => r.id));
    const newRecords = extractedRecords.filter(record => !existingIds.has(record.id));

    setAvailableRecords(prev => [...prev, ...(newRecords || [])]);
    pageRef.current = nextPage;
    hasMoreRef.current = !!more;

    setLoading(false);
    busyRef.current = false;
  };

  const handleShowList = () => {
    setShowList(!showList)
  }

  const handleToggle = (value) => {
    const exists = checked.includes(value);
    const newChecked = [...checked];

    if (!exists) {
      newChecked.push(value);
    } else {
      newChecked.splice(value, 1);
    }

    setChecked(newChecked);
  };

  const handleAddRecords = () => {
    setRecords(prev => [...prev, ...checked])
    const checkedIds = new Set(checked.map(c => c.id));
    const filteredItems = availableRecords.filter(item => !checkedIds.has(item.id));
    setAvailableRecords(filteredItems)
    setChecked([])

  }

  return (
    <Box className='addMoreRecordsContainer'>
      <button onClick={handleShowList} className={ showList ? "closeList" : "openList"}><IoIosAddCircleOutline /></button>
            { showList &&
            <Box className='addMoreListContainer'>
              {
                loading ?
                 <Box>
                  <p>Loading...</p>
                 </Box>
                 :
                 availableRecords.length < 1 ? 
                 <Box>
                  <p>No records to select</p>
                 </Box>
                 :
                 <List style={listStyle}>
                    {
                        availableRecords.map((r) => (
                            <ListItem
                                key={r.id}
                                disablePadding
                            >
                                <ListItemButton role={undefined} onClick={() => handleToggle(r)} dense>
                                <ListItemIcon>
                                    <Checkbox
                                    edge="start"
                                    checked={checked.includes(r)}
                                    tabIndex={-1}
                                      disableRipple
                                    //   inputProps={{ 'aria-labelledby': labelId }}
                                    />
                                </ListItemIcon>
                                <ListItemText id={r.id} primary={r.Full_Name || r.First_Name} style={{fontSize:'14px'}}/>
                                </ListItemButton>
                            </ListItem>
                    ))}
                </List>
              }
                <Box className='actionButtonsContainer'>
                    <button onClick={handleAddRecords}>
                        Confirm
                    </button>
                    <button
                        onClick={fetchMore}
                        disabled={loading || !hasMoreRef.current}
                        className=""
                    >
                        {"Load more"}
                    </button>
                </Box>
            </Box>
        }
    </Box>
    
  );
}

export default AddMoreRecords