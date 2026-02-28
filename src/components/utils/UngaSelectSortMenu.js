import { ArrowDownwardOutlined, ArrowDropDownSharp, ArrowUpwardOutlined, SortOutlined } from "@mui/icons-material";
import { Button, Menu, MenuItem, Stack } from "@mui/material";
import { useState } from "react";

export default function UngaSelectSortMenu({ options, onChangeOrderBy, onChangeOrder, order, orderBy, fullWidth }) {
  const [orderByMenuAnchorEl, setOrderByMenuAnchorEl] = useState(null);

  const openOrderByMenu = (event) => {
    setOrderByMenuAnchorEl(event.currentTarget);
  };

  const closeOrderByMenu = () => {
    setOrderByMenuAnchorEl(null);
  };

  const handleSelectOrderBy = (orderBy) => {
    onChangeOrderBy(orderBy);
    closeOrderByMenu();
  };

  const handleOrderChange = () => {
    onChangeOrder(order === 'asc' ? 'desc' : 'asc');
  }

  return (
    <Stack direction="row" spacing={1} width="100%" justifyContent="flex-end">
      <Button
        fullWidth={fullWidth}
        variant="outlined"
        startIcon={<SortOutlined />}
        endIcon={<ArrowDropDownSharp />}
        onClick={openOrderByMenu}
      >
        Ordenar por {options.find((option) => option.id === orderBy).label.toLowerCase()}
      </Button>
      <Menu
        id="order-by-menu"
        anchorEl={orderByMenuAnchorEl}
        open={Boolean(orderByMenuAnchorEl)}
        onClose={closeOrderByMenu}
        MenuListProps={{
          'aria-labelledby': 'order-by-menu',
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.id} onClick={() => handleSelectOrderBy(option.id)}>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
      <Button
        variant="outlined"
        onClick={handleOrderChange}
        sx={{ px: 2 }}
      >
        {order === 'asc' ? <ArrowDownwardOutlined />  : <ArrowUpwardOutlined />}
      </Button>
    </Stack>
  )
}