import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "src/context/UserContext";
import { nameMapper } from "src/helpers/parsers";

const EMPTY_FILTERS = {
  recommendedLevels: [],
  cores: [],
  curricularObjectives: [],
  themes: [],
  searchText: '',
}

export default function useActivitiesFilters({ recommendedLevels, allCores, allLevels } = {}) {
  const { institution } = useContext(UserContext);
  const [cores, setCores] = useState(allCores || []);
  const [levels, setLevels] = useState(allLevels || []);
  const [curricularObjectives, setCurricularObjectives] = useState([]);
  const [themes, setThemes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    recommendedLevels: recommendedLevels || [],
  });

  useEffect(() => {
    const getData = async () => {
      if (cores.length === 0) {
        const coresResponse = institution
        ? await axios.get(`/api/institutions/${institution.id}/cores`)
        : await axios.get(`/api/cores`);
        setCores(coresResponse.data);
      }
      if (levels.length === 0) {
        const levelsResponse = await axios.get('/api/levels');
        setLevels(levelsResponse.data);
      }
      if (curricularObjectives.length === 0) {
        const curricularObjectivesResponse = await axios.get(`/api/curricular-objectives?methodology=${institution.methodology}`);
        setCurricularObjectives(curricularObjectivesResponse.data);
      }
      if (themes.length === 0) {
        const themesResponse = await axios.get('/api/themes');
        setThemes(themesResponse.data);
      }
    }
    getData();
  }, [])

  const toggleFilters = () => setShowFilters((oldValue) => !oldValue);

  const handleSearchChange = ({ target: { value } }) => {
    setFilters((oldValue) => ({ ...oldValue, searchText: value }));
  };

  const handleMultipleSelectChange = ({ target: { name, value } }) => {
    setFilters((oldFilters) => ({ ...oldFilters, [name]: value }));
  };

  const isFilteringKey = (key) => filters[key].length > 0

  const isFiltering = () => {
    return Object.keys(filters).some((key) => isFilteringKey(key));
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
  }
  const addFiltersToPath = (path, isPublic) => {
    Object.entries(filters).forEach(([filterKey, values]) => {
      if (filterKey === 'searchText') return;
      let valuesToUse = [...values];
      if (filterKey === 'cores' && isPublic) {
        valuesToUse = cores.filter((core) => values.includes(core.id)).map(nameMapper);
      }
      if (isFilteringKey(filterKey)) path += `${filterKey}=${valuesToUse.toString()}&`;
    });
    if (Boolean(filters.searchText)) path += `name=${filters.searchText}`;
    return path;
  }

  return {
    filters,
    setFilters,
    clearFilters,
    handleSearchChange,
    handleMultipleSelectChange,
    addFiltersToPath,
    toggleFilters,
    cores,
    levels,
    curricularObjectives,
    themes,
    showFilters,
    isFiltering,
  }
}