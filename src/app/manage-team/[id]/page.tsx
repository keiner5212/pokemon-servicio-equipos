"use client";
import HoloCard from "@/components/cards/Card";
import EmptyCard from "@/components/cards/EmptyCard";
import usePokemons from "@/components/hooks/usePokemons";
import LoaderScreen from "@/components/Loaders/LoaderScreen";
import Modal from "@/components/modal/Modal";
import { PokemonService } from "@/modules/services/PokemonService";
import { TeamsServices } from "@/modules/services/TeamsService";
import { Pokemon } from "@/modules/types/Pokemon";
import { Team } from "@/modules/types/Team";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

const Page = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const {
    data: pokemons,
    isLoading: isLoadingAllPokemons,
    error: errorAllPokemons,
  } = usePokemons();
  const [showPokemons, setShowPokemons] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const queryClient = useQueryClient();
  const { id: teamId } = useParams();

  const getAllPokemons = async (team: Team | undefined) => {
    if (!team || team.pokemonesIds.length === 0) return [];
    return await Promise.all(
      team.pokemonesIds.map((equipoId) => PokemonService.getOne(equipoId))
    );
  };
  const {
    data: team,
    isLoading: isLoadingTeam,
    error: errorTeam,
  } = useQuery({
    queryKey: ["pok-team", teamId],
    queryFn: () => TeamsServices.getOne(teamId as string),
    enabled: !!teamId,
  });

  const {
    data: pokemonsOfTeam,
    isLoading: isLoadingPokemons,
    error: errorLoadingPokemons,
  } = useQuery({
    queryKey: ["Pokemons", teamId, team?.pokemonesIds],
    queryFn: () => getAllPokemons(team),
    enabled: !!team,
  });

  const onChangePokemon = async () => {
    if (!team || !selectedPokemon) return;
    await TeamsServices.updateTeam(team.id, {
      nombre: team.nombre,
      pokemonIds: [...team.pokemonesIds, selectedPokemon.id],
    });
  };

  const TeamMutation = useMutation({
    mutationFn: onChangePokemon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pok-team", teamId] });
      setSelectedPokemon(null);
    },
  });

  const handleDeletePokemon = async (pokemonId: number) => {
    if (!team) return;

    const indexToRemove = team.pokemonesIds.indexOf(pokemonId);
    if (indexToRemove !== -1) {
      const newPokemons = [...team.pokemonesIds];
      newPokemons.splice(indexToRemove, 1);
      await TeamsServices.updateTeam(team.id, {
        nombre: team.nombre,
        pokemonIds: newPokemons,
      });
      queryClient.invalidateQueries({ queryKey: ["pok-team", teamId] });
    }
  };

  if (isLoadingAllPokemons || isLoadingTeam) return <LoaderScreen />;

  if (errorAllPokemons || errorLoadingPokemons)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500 text-lg font-semibold">
          Ocurrió un error al cargar los pokemons. Inténtalo de nuevo más tarde.
        </p>
      </div>
    );

  if (errorTeam)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500 text-lg font-semibold">
          Ocurrio un error al cargar el equipo. Inténtalo de nuevo mas tarde.
        </p>
      </div>
    );

  return (
    <div className="h-full w-full">
      <h1>Equipo: {team?.nombre}</h1>
      <h2>Pokemones:</h2>
      <br />
      <section className="flex flex-wrap flex-row">
        {isLoadingPokemons ? (
          <LoaderScreen />
        ) : (
          Array.from({ length: 6 }).map((_, index) => {
            const temp = (pokemonsOfTeam || [])[index];
            if (!temp) {
              return (
                <EmptyCard
                  key={index + "emptycard"}
                  onClick={() => {
                    setShowPokemons(true);
                  }}
                ></EmptyCard>
              );
            } else {
              return (
                <HoloCard
                  showTrashIcon={true}
                  onDelete={(pokemon: Pokemon) => {
                    handleDeletePokemon(pokemon.id);
                  }}
                  key={temp.id + "card" + index}
                  pokemon={temp}
                />
              );
            }
          })
        )}
      </section>
      <Modal
        isOpen={showPokemons}
        title="Selecciona un pokemon"
        onClose={() => setShowPokemons(false)}
      >
        <div className="flex flex-wrap flex-row gap-1 overflow-y-auto h-[calc(100vh-12rem)]">
          <input
            type="text"
            placeholder="Buscar Pokémon..."
            className="w-full p-2 mb-2 border border-gray-300 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {pokemons
            ?.filter(
              (pokemon) =>
                pokemon.nombre.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((pokemon) => (
              <HoloCard
                onClick={() => {
                  setSelectedPokemon(pokemon);
                  setShowPokemons(false);
                  TeamMutation.mutate();
                }}
                showTrashIcon={false}
                key={pokemon.id}
                pokemon={pokemon}
              />
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default Page;
